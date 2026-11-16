package com.calcular.gastos.entidades;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "planejamentos_futuros")
@Getter @Setter @NoArgsConstructor
public class PlanejamentoFuturo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @JsonIgnore
    @Column(name = "usuario_email", length = 254)
    private String usuarioEmail;
    @Column(nullable = false, length = 100)
    private String titulo;
    @Column(length = 1000)
    private String descricao;
    @Column(nullable = false, length = 40)
    private String categoria;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valorEstimado;
    private LocalDate dataMeta;
}
