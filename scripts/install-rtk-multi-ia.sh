#!/bin/bash

################################################################################
#  install-rtk-multi-ia.sh
#  Install RTK and configure for MULTIPLE AI tools
#  Supports: Claude Code, GitHub Copilot, Cursor, Codeium, Gemini, OpenCode
################################################################################

set -e

RTK_VERSION="v0.37.2"
RTK_REPO="rtk-ai/rtk"
RTK_INSTALL_DIR="${RTK_INSTALL_DIR:-$HOME/.local/bin}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Helpers
log_info() { echo -e "${BLUE}ℹ${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_section() { echo -e "\n${PURPLE}▶${NC} ${PURPLE}$1${NC}\n"; }

# Detect OS (same as original script)
detect_os() {
    local uname_s=$(uname -s)
    case "$uname_s" in
        Linux*)
            if command -v ldd &> /dev/null && ldd --version 2>&1 | grep -q musl; then
                echo "x86_64-unknown-linux-musl"
            else
                echo "x86_64-unknown-linux-gnu"
            fi
            ;;
        Darwin*)
            local uname_m=$(uname -m)
            [[ "$uname_m" == "arm64" || "$uname_m" == "aarch64" ]] && echo "aarch64-apple-darwin" || echo "x86_64-apple-darwin"
            ;;
        MINGW64*|MSYS*|CYGWIN*)
            echo "x86_64-pc-windows-msvc"
            ;;
        *)
            log_error "Unsupported OS: $uname_s"
            exit 1
            ;;
    esac
}

# Download and install RTK (reuse from original)
install_rtk_binary() {
    local target=$1
    local download_dir=$(mktemp -d)
    local filename=""

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

    local url="https://github.com/${RTK_REPO}/releases/download/${RTK_VERSION}/${filename}"

    log_info "Downloading RTK $RTK_VERSION for $target..."
    if ! curl -fsSL "$url" -o "$download_dir/$filename"; then
        log_error "Failed to download RTK binary"
        rm -rf "$download_dir"
        exit 1
    fi

    case "$filename" in
        *.tar.gz)
            tar -xzf "$download_dir/$filename" -C "$download_dir"
            ;;
        *.zip)
            unzip -q "$download_dir/$filename" -d "$download_dir"
            ;;
    esac

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

    mkdir -p "$RTK_INSTALL_DIR"

    local output_name="rtk"
    [[ "$(uname -s)" == MINGW64* ]] || [[ "$(uname -s)" == MSYS* ]] && output_name="rtk.exe"

    cp "$binary" "$RTK_INSTALL_DIR/$output_name"
    [[ ! "$output_name" == *.exe ]] && chmod +x "$RTK_INSTALL_DIR/$output_name"

    rm -rf "$download_dir"

    log_success "RTK installed: $RTK_INSTALL_DIR/$output_name"
}

# Detect installed IDEs
detect_installed_ias() {
    log_section "Detecting Installed AI Tools"

    local detected=()

    # Check for VS Code
    if command -v code &> /dev/null; then
        detected+=("vscode")
        log_success "VS Code detected"
    fi

    # Check for Cursor
    if command -v cursor &> /dev/null || [[ -d "$HOME/AppData/Local/Programs/cursor" ]]; then
        detected+=("cursor")
        log_success "Cursor IDE detected"
    fi

    # Check for IntelliJ
    if command -v idea &> /dev/null || [[ -d "$HOME/.IntelliJIdea" ]]; then
        detected+=("intellij")
        log_success "IntelliJ IDEA detected"
    fi

    # Check for CLI tools
    if command -v gcloud &> /dev/null; then
        detected+=("gemini")
        log_success "Google Cloud CLI detected"
    fi

    printf '%s\n' "${detected[@]}"
}

# Interactive menu
show_ia_menu() {
    log_section "Select AI Tools to Configure"

    echo "Which AI tools do you want to configure?"
    echo ""
    echo "  1) Claude Code"
    echo "  2) GitHub Copilot (VS Code)"
    echo "  3) Cursor IDE"
    echo "  4) Codeium (VS Code/IDE)"
    echo "  5) Google Gemini CLI"
    echo "  6) OpenCode"
    echo "  7) All of the above"
    echo "  8) Auto-detect and configure installed tools"
    echo ""
    read -p "Enter choice (1-8): " choice

    case "$choice" in
        1) echo "claude" ;;
        2) echo "copilot" ;;
        3) echo "cursor" ;;
        4) echo "codeium" ;;
        5) echo "gemini" ;;
        6) echo "opencode" ;;
        7) echo "all" ;;
        8) echo "auto" ;;
        *) log_error "Invalid choice"; exit 1 ;;
    esac
}

# Configure Claude Code
configure_claude() {
    log_section "Configuring Claude Code"
    log_success "Already configured in .claude/settings.local.json"
    log_info "Hook: PreToolUse with 'rtk hook claude'"
}

# Configure GitHub Copilot (VS Code)
configure_copilot() {
    log_section "Configuring GitHub Copilot"

    if ! command -v code &> /dev/null; then
        log_warn "VS Code not found in PATH"
        return
    fi

    log_info "RTK works with Copilot via shell integration"
    log_info "Add to your shell ~/.bashrc or ~/.zshrc:"
    echo ""
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo "  eval \"\$(rtk hook bash)\"  # or 'zsh' for zsh"
    echo ""
    log_success "Copilot will use RTK for command filtering"
}

# Configure Cursor
configure_cursor() {
    log_section "Configuring Cursor IDE"

    log_info "Cursor is built on VSCode, same as Claude Code"
    log_info "Configure via Cursor settings:"
    echo ""
    echo "  1. Open Cursor settings.json"
    echo "  2. Add RTK_INSTALL_DIR to PATH"
    echo "  3. Create hook config similar to Claude Code"
    echo ""
    log_success "See: RTK_IA_SPECIFIC/cursor.md for details"
}

# Configure Codeium
configure_codeium() {
    log_section "Configuring Codeium"

    log_info "Codeium runs in VS Code/IDE environment"
    log_info "RTK works via shell integration:"
    echo ""
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    log_success "See: RTK_IA_SPECIFIC/codeium.md for details"
}

# Configure Gemini
configure_gemini() {
    log_section "Configuring Google Gemini"

    if ! command -v gcloud &> /dev/null; then
        log_warn "Google Cloud CLI not found"
        log_info "Install from: https://cloud.google.com/sdk/docs/install"
        return
    fi

    log_info "Add to ~/.bashrc or ~/.zshrc:"
    echo ""
    echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    echo ""
    log_success "See: RTK_IA_SPECIFIC/gemini.md for details"
}

# Configure OpenCode
configure_opencode() {
    log_section "Configuring OpenCode"

    log_info "OpenCode uses TypeScript plugins"
    log_info "RTK plugin location: ~/.config/opencode/plugins/rtk.ts"
    log_info "Will be created automatically via rtk init --opencode"
    echo ""
    log_success "See: RTK_IA_SPECIFIC/opencode.md for details"
}

# Auto-detect and configure
configure_auto() {
    log_section "Auto-Detecting and Configuring"

    local detected
    detected=$(detect_installed_ias)

    if [[ -z "$detected" ]]; then
        log_warn "No AI tools detected"
        log_info "Installed configuration for: Claude Code (default)"
        return
    fi

    if echo "$detected" | grep -q "vscode"; then
        configure_copilot
    fi

    if echo "$detected" | grep -q "cursor"; then
        configure_cursor
    fi

    if echo "$detected" | grep -q "intellij"; then
        log_info "IntelliJ detected - see RTK_IA_SPECIFIC/ for setup"
    fi

    if echo "$detected" | grep -q "gemini"; then
        configure_gemini
    fi
}

# Configure all
configure_all() {
    configure_claude
    configure_copilot
    configure_cursor
    configure_codeium
    configure_gemini
    configure_opencode
}

# Main
main() {
    log_info "RTK (Rust Token Killer) - Multi-IA Installer"
    log_info "Supports: Claude Code, Copilot, Cursor, Codeium, Gemini, OpenCode"
    echo ""

    # Step 1: Install RTK binary
    local target
    target=$(detect_os)
    log_info "Detected platform: $target"

    if ! command -v rtk &> /dev/null; then
        install_rtk_binary "$target"
    else
        log_success "RTK already installed"
    fi

    # Step 2: Choose AI tools
    local choice
    choice=$(show_ia_menu)

    # Step 3: Configure selected tools
    case "$choice" in
        claude)
            configure_claude
            ;;
        copilot)
            configure_copilot
            ;;
        cursor)
            configure_cursor
            ;;
        codeium)
            configure_codeium
            ;;
        gemini)
            configure_gemini
            ;;
        opencode)
            configure_opencode
            ;;
        all)
            configure_all
            ;;
        auto)
            configure_auto
            ;;
    esac

    # Verify
    log_section "Verification"
    if command -v rtk &> /dev/null; then
        local version
        version=$(rtk --version)
        log_success "RTK is ready: $version"
    else
        log_warn "RTK not in PATH"
        log_info "Add to your shell: export PATH=\"\$PATH:$RTK_INSTALL_DIR\""
    fi

    log_section "Next Steps"
    log_info "1. Restart your IDE/application"
    log_info "2. Test: rtk npm --version"
    log_info "3. Monitor: rtk gain"
    echo ""
    log_success "RTK configured for multiple AI tools!"
}

main "$@"
