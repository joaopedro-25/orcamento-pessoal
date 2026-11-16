package com.calcular.gastos.repositorios;

import com.calcular.gastos.entidades.PlanejamentoFuturo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlanejamentoFuturoRepository extends JpaRepository<PlanejamentoFuturo, Long> {
    List<PlanejamentoFuturo> findAllByUsuarioEmailOrderByDataMetaAsc(String usuarioEmail);
    java.util.Optional<PlanejamentoFuturo> findByIdAndUsuarioEmail(Long id, String usuarioEmail);
}
