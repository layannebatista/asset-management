#!/bin/bash

################################################################################
#  install-rtk.sh
#  Install RTK (Rust Token Killer) binary for Windows/Linux/macOS
#  Reduces LLM token consumption by 60-90% for development tools
################################################################################

set -e

RTK_VERSION="v0.37.2"
RTK_REPO="rtk-ai/rtk"
RTK_INSTALL_DIR="${RTK_INSTALL_DIR:-$HOME/.local/bin}"
RTK_BINARY_NAME="rtk"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}✓${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1" >&2
}

log_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

# Detect OS
detect_os() {
    local uname_s=$(uname -s)
    local uname_m=$(uname -m)

    case "$uname_s" in
        Linux*)
            if command -v ldd &> /dev/null && ldd --version 2>&1 | grep -q musl; then
                echo "x86_64-unknown-linux-musl"
            else
                echo "x86_64-unknown-linux-gnu"
            fi
            ;;
        Darwin*)
            case "$uname_m" in
                arm64|aarch64)
                    echo "aarch64-apple-darwin"
                    ;;
                x86_64)
                    echo "x86_64-apple-darwin"
                    ;;
                *)
                    log_error "Unsupported macOS architecture: $uname_m"
                    exit 1
                    ;;
            esac
            ;;
        MINGW64*|MSYS*|CYGWIN*)
            echo "x86_64-pc-windows-msvc"
            ;;
        *)
            log_error "Unsupported operating system: $uname_s"
            echo "Supported OS: Linux, macOS, Windows (Git Bash/MSYS/Cygwin)"
            exit 1
            ;;
    esac
}

# Detect architecture
detect_arch() {
    uname -m
}

# Download RTK binary
download_rtk() {
    local target=$1
    local download_dir=$(mktemp -d)
    local filename=""
    local url=""

    case "$target" in
        x86_64-unknown-linux-musl|x86_64-unknown-linux-gnu)
            filename="rtk-x86_64-unknown-linux-musl.tar.gz"
            ;;
        aarch64-apple-darwin)
            filename="rtk-aarch64-apple-darwin.tar.gz"
            ;;
        x86_64-apple-darwin)
            filename="rtk-x86_64-apple-darwin.tar.gz"
            ;;
        x86_64-pc-windows-msvc)
            filename="rtk-x86_64-pc-windows-msvc.zip"
            ;;
        *)
            log_error "Unsupported target: $target"
            exit 1
            ;;
    esac

    url="https://github.com/${RTK_REPO}/releases/download/${RTK_VERSION}/${filename}"

    log_info "Downloading RTK $RTK_VERSION for $target..."
    log_info "URL: $url"

    if ! curl -fsSL "$url" -o "$download_dir/$filename"; then
        log_error "Failed to download RTK binary"
        rm -rf "$download_dir"
        exit 1
    fi

    log_success "Downloaded: $filename"

    # Extract based on file type
    case "$filename" in
        *.tar.gz)
            log_info "Extracting tarball..."
            tar -xzf "$download_dir/$filename" -C "$download_dir"
            ;;
        *.zip)
            log_info "Extracting zip..."
            unzip -q "$download_dir/$filename" -d "$download_dir"
            ;;
        *)
            log_error "Unknown file type: $filename"
            rm -rf "$download_dir"
            exit 1
            ;;
    esac

    # Find the binary
    local binary=""
    if [[ "$target" == *"windows"* ]]; then
        binary=$(find "$download_dir" -name "rtk.exe" -type f 2>/dev/null | head -1)
    else
        binary=$(find "$download_dir" -name "rtk" -type f ! -name "*.sha256" 2>/dev/null | head -1)
    fi

    if [[ -z "$binary" ]]; then
        log_error "Could not find RTK binary in archive"
        rm -rf "$download_dir"
        exit 1
    fi

    echo "$binary"
    # Note: cleanup happens after installation
}

# Install RTK binary
install_rtk() {
    local binary=$1

    # Create install directory if it doesn't exist
    mkdir -p "$RTK_INSTALL_DIR"

    # Determine output binary name
    local output_name="$RTK_BINARY_NAME"
    if [[ "$(uname -s)" == MINGW64* ]] || [[ "$(uname -s)" == MSYS* ]] || [[ "$(uname -s)" == CYGWIN* ]]; then
        output_name="$RTK_BINARY_NAME.exe"
    fi

    local install_path="$RTK_INSTALL_DIR/$output_name"

    log_info "Installing to: $install_path"

    # Copy binary
    if ! cp "$binary" "$install_path"; then
        log_error "Failed to copy binary to $install_path"
        return 1
    fi

    # Make executable (for Unix-like systems)
    if [[ ! "$output_name" == *.exe ]]; then
        chmod +x "$install_path"
    fi

    log_success "RTK binary installed: $install_path"

    # Check if it's in PATH
    if ! command -v "$RTK_BINARY_NAME" &> /dev/null; then
        log_warn "RTK binary is not in PATH"
        log_warn "Add $RTK_INSTALL_DIR to your PATH:"
        log_warn ""
        log_warn "  export PATH=\"\$PATH:$RTK_INSTALL_DIR\""
        log_warn ""
        log_warn "Or add to your shell config file (~/.bashrc, ~/.zshrc, etc.)"
    else
        log_success "RTK is available in PATH"
    fi

    return 0
}

# Main
main() {
    log_info "RTK (Rust Token Killer) Installer v$RTK_VERSION"
    log_info ""

    # Detect target
    local target
    target=$(detect_os)
    log_info "Detected target: $target"

    # Download RTK
    local binary
    binary=$(download_rtk "$target")

    if [[ -z "$binary" ]]; then
        log_error "Failed to download RTK"
        exit 1
    fi

    log_success "Binary path: $binary"

    # Install
    if install_rtk "$binary"; then
        log_success "Installation complete!"

        # Cleanup
        local download_dir=$(dirname "$binary")
        rm -rf "$download_dir"

        # Verify installation
        log_info "Verifying installation..."
        if command -v "$RTK_BINARY_NAME" &> /dev/null; then
            local version
            version=$("$RTK_BINARY_NAME" --version 2>&1 || echo "unknown")
            log_success "RTK is ready: $version"

            log_info ""
            log_info "Next steps:"
            log_info "1. Run: rtk init -g              (configure for Claude Code)"
            log_info "2. View: cat ~/.claude/RTK.md   (see RTK instructions)"
            log_info "3. Test: rtk npm run build      (try RTK in action)"
        else
            log_warn "Could not verify RTK installation"
            log_warn "Please restart your terminal or run: export PATH=\"\$PATH:$RTK_INSTALL_DIR\""
        fi
    else
        log_error "Installation failed"
        exit 1
    fi
}

# Run main
main "$@"
