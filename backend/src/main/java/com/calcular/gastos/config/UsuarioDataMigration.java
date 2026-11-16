package com.calcular.gastos.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.List;

@Component
public class UsuarioDataMigration implements ApplicationRunner {
    private final JdbcTemplate jdbc;
    private final DataSource dataSource;

    public UsuarioDataMigration(JdbcTemplate jdbc, DataSource dataSource) {
        this.jdbc = jdbc;
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        jdbc.update("UPDATE orcamentos_mensais SET usuario_email = ? WHERE usuario_email IS NULL", SegurancaConfig.JOAO_EMAIL);
        jdbc.update("UPDATE planejamentos_futuros SET usuario_email = ? WHERE usuario_email IS NULL", SegurancaConfig.JOAO_EMAIL);

        try (Connection connection = dataSource.getConnection()) {
            if (!connection.getMetaData().getDatabaseProductName().equalsIgnoreCase("PostgreSQL")) return;
        }

        List<String> oldMonthConstraints = jdbc.queryForList("""
                SELECT c.conname
                FROM pg_constraint c
                JOIN pg_class t ON t.oid = c.conrelid
                WHERE t.relname = 'orcamentos_mensais'
                  AND c.contype = 'u'
                  AND cardinality(c.conkey) = 1
                  AND EXISTS (
                      SELECT 1
                      FROM unnest(c.conkey) AS key(attnum)
                      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = key.attnum
                      WHERE a.attname = 'mes'
                  )
                """, String.class);
        for (String constraint : oldMonthConstraints) {
            jdbc.execute("ALTER TABLE orcamentos_mensais DROP CONSTRAINT IF EXISTS \"" + constraint.replace("\"", "\"\"") + "\"");
        }
        jdbc.execute("ALTER TABLE orcamentos_mensais ALTER COLUMN usuario_email SET NOT NULL");
        jdbc.execute("ALTER TABLE planejamentos_futuros ALTER COLUMN usuario_email SET NOT NULL");
    }
}
