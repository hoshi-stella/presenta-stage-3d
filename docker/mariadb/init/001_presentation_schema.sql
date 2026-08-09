CREATE TABLE IF NOT EXISTS presentations (
  id CHAR(36) NOT NULL,
  presentation_key VARCHAR(191) NOT NULL,
  title VARCHAR(255) NOT NULL,
  lifecycle ENUM('draft', 'rehearsal', 'presented', 'published', 'archived') NOT NULL DEFAULT 'draft',
  presented_revision_id CHAR(36) NULL,
  published_revision_id CHAR(36) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY presentations_presentation_key_unique (presentation_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS presentation_revisions (
  id CHAR(36) NOT NULL,
  presentation_id CHAR(36) NOT NULL,
  revision_number INT UNSIGNED NOT NULL,
  snapshot_name VARCHAR(255) NULL,
  snapshot_note TEXT NULL,
  package_json JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY presentation_revisions_number_unique (presentation_id, revision_number),
  CONSTRAINT presentation_revisions_presentation_id_foreign
    FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS presentation_publication_events (
  id CHAR(36) NOT NULL,
  presentation_id CHAR(36) NOT NULL,
  revision_id CHAR(36) NOT NULL,
  event_type ENUM('presented', 'published') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY presentation_publication_events_presentation_id_index (presentation_id),
  KEY presentation_publication_events_revision_id_index (revision_id),
  CONSTRAINT presentation_publication_events_presentation_id_foreign
    FOREIGN KEY (presentation_id) REFERENCES presentations(id) ON DELETE CASCADE,
  CONSTRAINT presentation_publication_events_revision_id_foreign
    FOREIGN KEY (revision_id) REFERENCES presentation_revisions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
