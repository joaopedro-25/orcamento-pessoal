package com.calcular.gastos.controladores;

import com.calcular.gastos.entidades.Dinheiro;
import com.calcular.gastos.repositorios.DinheiroRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.security.Principal;

@RestController
@RequestMapping("/api/meses")
public class OrcamentoController {
    private final DinheiroRepository repository;
    public OrcamentoController(DinheiroRepository repository) { this.repository = repository; }

    @GetMapping
    public List<Dinheiro> listar(Principal principal) { return repository.findAllByUsuarioEmail(principal.getName()); }

    @GetMapping("/{mes}")
    public ResponseEntity<Dinheiro> buscar(@PathVariable String mes, Principal principal) {
        return repository.findByUsuarioEmailAndMes(principal.getName(), mes).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{mes}")
    public Dinheiro salvar(@PathVariable String mes, @RequestBody Dinheiro entrada, Principal principal) {
        if (mes == null || !mes.matches("\\d{4}-(0[1-9]|1[0-2])")) throw new IllegalArgumentException("Mês deve estar no formato YYYY-MM");
        if (entrada.getSalario() == null || entrada.getSalario().signum() < 0) throw new IllegalArgumentException("Salário inválido");
        if (entrada.getGastos() == null || entrada.getGastos().stream().anyMatch(g -> g.getNome() == null || g.getNome().isBlank() || g.getValor() == null || g.getValor().signum() < 0)) throw new IllegalArgumentException("Confira nome e valor dos gastos");
        Dinheiro mesSalvo = repository.findByUsuarioEmailAndMes(principal.getName(), mes).orElseGet(Dinheiro::new);
        mesSalvo.setMes(mes);
        mesSalvo.setUsuarioEmail(principal.getName());
        mesSalvo.setSalario(entrada.getSalario());
        mesSalvo.setGastos(entrada.getGastos());
        return repository.save(mesSalvo);
    }

    @PatchMapping("/{mes}/salario")
    public ResponseEntity<Void> salvarSalario(@PathVariable String mes, @RequestBody BigDecimal salario, Principal principal) {
        if (mes == null || !mes.matches("\\d{4}-(0[1-9]|1[0-2])") || salario == null || salario.signum() < 0) {
            return ResponseEntity.badRequest().build();
        }
        Dinheiro orcamento = repository.findByUsuarioEmailAndMes(principal.getName(), mes).orElseGet(() -> {
            Dinheiro novo = new Dinheiro();
            novo.setMes(mes);
            novo.setUsuarioEmail(principal.getName());
            return novo;
        });
        orcamento.setSalario(salario);
        repository.save(orcamento);
        return ResponseEntity.noContent().build();
    }
}
