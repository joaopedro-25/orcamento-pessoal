package com.calcular.gastos.entidades;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orcamentos_mensais", uniqueConstraints = @UniqueConstraint(columnNames = {"usuario_email", "mes"}))
@Getter @Setter @NoArgsConstructor
public class Dinheiro {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 7)
    private String mes; // YYYY-MM
    @JsonIgnore
    @Column(name = "usuario_email", length = 254)
    private String usuarioEmail;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal salario = BigDecimal.ZERO;
    @ElementCollection
    @CollectionTable(name = "gastos_mensais", joinColumns = @JoinColumn(name = "orcamento_id"))
    private List<Gasto> gastos = new ArrayList<>();

    public BigDecimal getTotalGastos() {
        return gastos.stream().map(Gasto::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    public BigDecimal getSaldo() { return salario.subtract(getTotalGastos()); }
}
