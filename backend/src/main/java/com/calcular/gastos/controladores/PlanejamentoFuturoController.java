package com.calcular.gastos.controladores;

import com.calcular.gastos.entidades.PlanejamentoFuturo;
import com.calcular.gastos.repositorios.PlanejamentoFuturoRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Set;
import java.security.Principal;

@RestController
@RequestMapping("/api/planejamentos")
public class PlanejamentoFuturoController {
    private static final Set<String> CATEGORIAS = Set.of("Reserva de emergência", "Moradia", "Educação", "Compra importante", "Viagem", "Veículo", "Saúde", "Outros");
    private final PlanejamentoFuturoRepository repository;

    public PlanejamentoFuturoController(PlanejamentoFuturoRepository repository) { this.repository = repository; }

    @GetMapping
    public List<PlanejamentoFuturo> listar(Principal principal) { return repository.findAllByUsuarioEmailOrderByDataMetaAsc(principal.getName()); }

    @PostMapping
    public ResponseEntity<PlanejamentoFuturo> criar(@RequestBody PlanejamentoFuturo entrada, Principal principal) {
        validar(entrada);
        entrada.setId(null);
        entrada.setUsuarioEmail(principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(entrada));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlanejamentoFuturo> atualizar(@PathVariable Long id, @RequestBody PlanejamentoFuturo entrada, Principal principal) {
        validar(entrada);
        return repository.findByIdAndUsuarioEmail(id, principal.getName()).map(atual -> {
            atual.setTitulo(entrada.getTitulo());
            atual.setDescricao(entrada.getDescricao());
            atual.setCategoria(entrada.getCategoria());
            atual.setValorEstimado(entrada.getValorEstimado());
            atual.setDataMeta(entrada.getDataMeta());
            return ResponseEntity.ok(repository.save(atual));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id, Principal principal) {
        PlanejamentoFuturo meta = repository.findByIdAndUsuarioEmail(id, principal.getName()).orElse(null);
        if (meta == null) return ResponseEntity.notFound().build();
        repository.delete(meta);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> erroDeValidacao(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }

    private void validar(PlanejamentoFuturo meta) {
        if (meta.getTitulo() == null || meta.getTitulo().isBlank() || meta.getTitulo().length() > 100) throw new IllegalArgumentException("Informe uma meta com até 100 caracteres.");
        if (meta.getDescricao() != null && meta.getDescricao().length() > 1000) throw new IllegalArgumentException("A descrição deve ter até 1000 caracteres.");
        if (!CATEGORIAS.contains(meta.getCategoria())) throw new IllegalArgumentException("Selecione uma categoria válida.");
        if (meta.getValorEstimado() == null || meta.getValorEstimado().signum() <= 0) throw new IllegalArgumentException("O custo estimado deve ser maior que zero.");
    }
}
