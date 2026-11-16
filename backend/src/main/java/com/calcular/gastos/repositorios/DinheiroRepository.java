package com.calcular.gastos.repositorios;

import com.calcular.gastos.entidades.Dinheiro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.Optional;
import java.util.List;

public interface DinheiroRepository extends JpaRepository<Dinheiro, Long> {
    @EntityGraph(attributePaths = "gastos")
    List<Dinheiro> findAllByUsuarioEmail(String usuarioEmail);

    @EntityGraph(attributePaths = "gastos")
    Optional<Dinheiro> findByUsuarioEmailAndMes(String usuarioEmail, String mes);
}
