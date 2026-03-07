package com.portfolio.assetmanagement.application.transfer.mapper;

import com.portfolio.assetmanagement.application.transfer.dto.TransferResponseDTO;
import com.portfolio.assetmanagement.domain.transfer.entity.TransferRequest;
import org.springframework.stereotype.Component;

/**
 * Mapper responsável por conversão entre TransferRequest e DTOs.
 *
 * <p>Evita vazamento de entidades e centraliza transformação.
 */
@Component
public class TransferMapper {

  public TransferResponseDTO toResponseDTO(TransferRequest transfer) {

    if (transfer == null) {
      return null;
    }

    // D1: adicionados requestedAt, approvedAt, completedAt
    return new TransferResponseDTO(
        transfer.getId(),
        transfer.getAsset().getId(),
        transfer.getFromUnit().getId(),
        transfer.getToUnit().getId(),
        transfer.getStatus(),
        transfer.getReason(),
        transfer.getRequestedAt(), // D1
        transfer.getApprovedAt(), // D1
        transfer.getCompletedAt()); // D1
  }
}
