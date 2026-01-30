package com.portfolio.asset_management.user.repository;

import com.portfolio.asset_management.organization.entity.Organization;
import com.portfolio.asset_management.unit.entity.Unit;
import com.portfolio.asset_management.user.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositório responsável pelo acesso a dados da entidade User.
 *
 * <p>Centraliza operações de persistência e consulta relacionadas aos usuários do sistema.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByEmail(String email);

  List<User> findByOrganization(Organization organization);

  List<User> findByUnit(Unit unit);
}
