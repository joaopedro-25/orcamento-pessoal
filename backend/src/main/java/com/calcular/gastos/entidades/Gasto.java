package com.calcular.gastos.entidades;

import jakarta.persistence.Embeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;

@Embeddable
@Getter @Setter @NoArgsConstructor
public class Gasto {
    private String nome;
    private BigDecimal valor = BigDecimal.ZERO;
    private boolean fixo;
    private String categoria = "Outros";
}
