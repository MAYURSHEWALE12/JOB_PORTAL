package com.jobportal.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("Running database schema migration check...");
        try (Connection connection = jdbcTemplate.getDataSource().getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            
            // Check for columns in interviews table
            boolean hasReminder24h = false;
            boolean hasReminder1h = false;
            
            try (ResultSet columns = metaData.getColumns(null, null, "interviews", null)) {
                while (columns.next()) {
                    String columnName = columns.getString("COLUMN_NAME");
                    if ("reminder_sent_24h".equalsIgnoreCase(columnName)) {
                        hasReminder24h = true;
                    }
                    if ("reminder_sent_1h".equalsIgnoreCase(columnName)) {
                        hasReminder1h = true;
                    }
                }
            }

            // Case-sensitive fallback for MySQL on some systems
            if (!hasReminder24h || !hasReminder1h) {
                try (ResultSet columns = metaData.getColumns(null, null, "INTERVIEWS", null)) {
                    while (columns.next()) {
                        String columnName = columns.getString("COLUMN_NAME");
                        if ("reminder_sent_24h".equalsIgnoreCase(columnName)) {
                            hasReminder24h = true;
                        }
                        if ("reminder_sent_1h".equalsIgnoreCase(columnName)) {
                            hasReminder1h = true;
                        }
                    }
                }
            }

            if (!hasReminder24h) {
                log.info("Column reminder_sent_24h is missing in interviews table. Adding it...");
                try {
                    jdbcTemplate.execute("ALTER TABLE interviews ADD COLUMN reminder_sent_24h BIT(1) DEFAULT b'0'");
                    log.info("Successfully added reminder_sent_24h column.");
                } catch (Exception ex) {
                    log.warn("Failed to alter table interviews using lowercase, trying uppercase: {}", ex.getMessage());
                    jdbcTemplate.execute("ALTER TABLE INTERVIEWS ADD COLUMN reminder_sent_24h BIT(1) DEFAULT b'0'");
                }
            } else {
                log.info("Column reminder_sent_24h already exists in interviews table.");
            }

            if (!hasReminder1h) {
                log.info("Column reminder_sent_1h is missing in interviews table. Adding it...");
                try {
                    jdbcTemplate.execute("ALTER TABLE interviews ADD COLUMN reminder_sent_1h BIT(1) DEFAULT b'0'");
                    log.info("Successfully added reminder_sent_1h column.");
                } catch (Exception ex) {
                    log.warn("Failed to alter table interviews using lowercase, trying uppercase: {}", ex.getMessage());
                    jdbcTemplate.execute("ALTER TABLE INTERVIEWS ADD COLUMN reminder_sent_1h BIT(1) DEFAULT b'0'");
                }
            } else {
                log.info("Column reminder_sent_1h already exists in interviews table.");
            }

        } catch (Exception e) {
            log.error("Failed to check or apply database schema updates: {}", e.getMessage());
        }
    }
}
