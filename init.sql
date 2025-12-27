CREATE USER manga_user WITH PASSWORD 'manga_password';
CREATE DATABASE manga_db;
GRANT ALL PRIVILEGES ON DATABASE manga_db TO manga_user;

\c manga_db
GRANT ALL ON SCHEMA public TO manga_user;

CREATE USER processor_user WITH PASSWORD 'processor_password';
CREATE DATABASE image_processor;
GRANT ALL PRIVILEGES ON DATABASE image_processor TO processor_user;

\c image_processor
GRANT ALL ON SCHEMA public TO processor_user;