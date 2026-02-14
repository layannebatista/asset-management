package com.portfolio.asset_management.transfer.mapper;

import com.portfolio.asset_management.transfer.dto.TransferResponseDTO;
import com.portfolio.asset_management.transfer.entity.TransferRequest;
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

    return new TransferResponseDTO(
        transfer.getId(),
        transfer.getAsset().getId(),
        transfer.getFromUnit().getId(),
        transfer.getToUnit().getId(),
        transfer.getStatus(),
        transfer.getReason());
  }
}
