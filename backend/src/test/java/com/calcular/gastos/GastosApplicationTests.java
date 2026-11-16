package com.calcular.gastos;

import com.calcular.gastos.repositorios.PlanejamentoFuturoRepository;
import com.calcular.gastos.repositorios.DinheiroRepository;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
		"spring.datasource.url=jdbc:h2:mem:gastos;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.jpa.show-sql=false"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(GastosApplicationTests.TestUsers.class)
class GastosApplicationTests {
	@Autowired MockMvc mvc;
	@Autowired PlanejamentoFuturoRepository repository;
	@Autowired DinheiroRepository dinheiroRepository;
	private final String auth = auth("joaopedro.abreu696@gmail.com");
	private final String lilianaAuth = auth("lilianaguiaimob@gmail.com");

	private static String auth(String email) {
		return "Basic " + Base64.getEncoder().encodeToString((email + ":teste123").getBytes(StandardCharsets.UTF_8));
	}

	@TestConfiguration
	static class TestUsers {
		@Bean
		UserDetailsService testUsers(PasswordEncoder encoder) {
			return new InMemoryUserDetailsManager(
					User.withUsername("joaopedro.abreu696@gmail.com").password(encoder.encode("teste123")).roles("USER").build(),
					User.withUsername("lilianaguiaimob@gmail.com").password(encoder.encode("teste123")).roles("USER").build());
		}
	}

	@BeforeEach
	void limpar() { repository.deleteAll(); dinheiroRepository.deleteAll(); }

	@Test
	void apiProtegidaEPlanejamentoPersisteCrud() throws Exception {
		mvc.perform(get("/api/planejamentos")).andExpect(status().isUnauthorized());

		String meta = """
				{"titulo":"Viagem","descricao":"Férias","categoria":"Viagem","valorEstimado":4500.00,"dataMeta":"2027-07-01"}
				""";
		mvc.perform(post("/api/planejamentos").header("Authorization", auth)
				.contentType(MediaType.APPLICATION_JSON).content(meta))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.id").exists());

		mvc.perform(get("/api/planejamentos").header("Authorization", auth))
				.andExpect(status().isOk()).andExpect(jsonPath("$[0].titulo").value("Viagem"))
				.andExpect(jsonPath("$[0].valorEstimado").value(4500.0));
		mvc.perform(get("/api/planejamentos").header("Authorization", lilianaAuth))
				.andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());

		mvc.perform(post("/api/planejamentos").header("Authorization", auth)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"titulo\":\"\",\"categoria\":\"Inválida\",\"valorEstimado\":0}"))
				.andExpect(status().isBadRequest());

		Long id = repository.findAll().get(0).getId();
		mvc.perform(put("/api/planejamentos/{id}", id).header("Authorization", auth)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"titulo\":\"Notebook\",\"categoria\":\"Compra importante\",\"valorEstimado\":3000}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.titulo").value("Notebook"));
		mvc.perform(delete("/api/planejamentos/{id}", id).header("Authorization", auth))
				.andExpect(status().isNoContent());
		mvc.perform(get("/api/planejamentos").header("Authorization", auth))
				.andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
	}

	@Test
	void perfisNaoCompartilhamOrcamentoMensal() throws Exception {
		mvc.perform(put("/api/meses/2026-11").header("Authorization", auth)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"salario\":5200,\"gastos\":[{\"nome\":\"Aluguel João\",\"valor\":1500,\"fixo\":true}]}"))
				.andExpect(status().isOk());
		mvc.perform(put("/api/meses/2026-11").header("Authorization", lilianaAuth)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"salario\":3100,\"gastos\":[{\"nome\":\"Aluguel Liliana\",\"valor\":900,\"fixo\":true}]}"))
				.andExpect(status().isOk());

		mvc.perform(get("/api/meses/2026-11").header("Authorization", auth))
				.andExpect(status().isOk()).andExpect(jsonPath("$.salario").value(5200.0))
				.andExpect(jsonPath("$.gastos[0].nome").value("Aluguel João"));
		mvc.perform(get("/api/meses/2026-11").header("Authorization", lilianaAuth))
				.andExpect(status().isOk()).andExpect(jsonPath("$.salario").value(3100.0))
				.andExpect(jsonPath("$.gastos[0].nome").value("Aluguel Liliana"));
	}

	@Test
	void salarioFicaPersistidoNoOrcamentoSemSalvarListaDeGastos() throws Exception {
		mvc.perform(put("/api/meses/2026-11").header("Authorization", auth)
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"salario\":0,\"gastos\":[{\"nome\":\"Aluguel\",\"valor\":1200,\"fixo\":true}]}"))
				.andExpect(status().isOk());
		mvc.perform(patch("/api/meses/2026-11/salario").header("Authorization", auth)
				.contentType(MediaType.APPLICATION_JSON).content("5200.00"))
				.andExpect(status().isNoContent());

		mvc.perform(get("/api/meses/2026-11").header("Authorization", auth))
				.andExpect(status().isOk()).andExpect(jsonPath("$.salario").value(5200.0))
				.andExpect(jsonPath("$.gastos[0].nome").value("Aluguel"));

		mvc.perform(patch("/api/meses/2026-11/salario").header("Authorization", auth)
				.contentType(MediaType.APPLICATION_JSON).content("-1"))
				.andExpect(status().isBadRequest());
	}
}
