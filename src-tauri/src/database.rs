use crate::error::AppError;
use serde::{Deserialize, Serialize};
use sqlx::{MySqlPool, PgPool, SqlitePool, Row};
use sqlx::Column;
use mongodb::{Client, Database as MongoDatabase};
use bson::doc;
use chrono::{DateTime, Utc, NaiveDateTime, NaiveDate, NaiveTime};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DatabaseType {
    MySQL,
    PostgreSQL,
    SQLite,
    MongoDB,
}

impl DatabaseType {
    pub fn as_str(&self) -> &'static str {
        match self {
            DatabaseType::MySQL => "mysql",
            DatabaseType::PostgreSQL => "postgresql",
            DatabaseType::SQLite => "sqlite",
            DatabaseType::MongoDB => "mongodb",
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<serde_json::Value>>,
    pub row_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseSchema {
    pub tables: Vec<TableInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TableInfo {
    pub name: String,
    pub columns: Vec<ColumnInfo>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ColumnInfo {
    pub name: String,
    pub data_type: String,
    pub is_nullable: bool,
    pub is_primary_key: bool,
}

#[derive(Clone, Debug)]
pub enum DatabaseConnection {
    MySQL(MySqlPool),
    PostgreSQL(PgPool),
    SQLite(SqlitePool),
    MongoDB(Client, MongoDatabase),
}

impl DatabaseConnection {
    // Extract value from MySQL row
    fn extract_value_from_mysql_row(&self, row: &sqlx::mysql::MySqlRow, index: usize) -> serde_json::Value {
        // Try different data types in order of preference
        match row.try_get::<Option<i64>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::Number(serde_json::Number::from(value)),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<i32>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::Number(serde_json::Number::from(value)),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<f64>, _>(index) {
            Ok(Some(value)) => {
                if let Some(num) = serde_json::Number::from_f64(value) {
                    return serde_json::Value::Number(num);
                }
            }
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<f32>, _>(index) {
            Ok(Some(value)) => {
                if let Some(num) = serde_json::Number::from_f64(value as f64) {
                    return serde_json::Value::Number(num);
                }
            }
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<bool>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::Bool(value),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // Try datetime types
        match row.try_get::<Option<NaiveDateTime>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::String(value.format("%Y-%m-%d %H:%M:%S").to_string()),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<NaiveDate>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::String(value.format("%Y-%m-%d").to_string()),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<NaiveTime>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::String(value.format("%H:%M:%S").to_string()),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // Try JSON types
        match row.try_get::<Option<serde_json::Value>, _>(index) {
            Ok(Some(value)) => return value,
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // Try string as fallback
        match row.try_get::<Option<String>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::String(value),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // Try Vec<u8> as last resort (for BLOB types)
        match row.try_get::<Option<Vec<u8>>, _>(index) {
            Ok(Some(value)) => {
                // Try to convert to string, fallback to base64
                match String::from_utf8(value) {
                    Ok(s) => return serde_json::Value::String(s),
                    Err(_) => return serde_json::Value::String("BLOB_DATA".to_string()),
                }
            }
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // If all else fails, return null
        serde_json::Value::Null
    }

    // Extract value from PostgreSQL row
    fn extract_value_from_postgresql_row(&self, row: &sqlx::postgres::PgRow, index: usize) -> serde_json::Value {
        // Try different data types in order of preference
        match row.try_get::<Option<i64>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::Number(serde_json::Number::from(value)),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<i32>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::Number(serde_json::Number::from(value)),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<f64>, _>(index) {
            Ok(Some(value)) => {
                if let Some(num) = serde_json::Number::from_f64(value) {
                    return serde_json::Value::Number(num);
                }
            }
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<f32>, _>(index) {
            Ok(Some(value)) => {
                if let Some(num) = serde_json::Number::from_f64(value as f64) {
                    return serde_json::Value::Number(num);
                }
            }
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<bool>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::Bool(value),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // Try datetime types
        match row.try_get::<Option<DateTime<Utc>>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::String(value.to_rfc3339()),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<NaiveDateTime>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::String(value.format("%Y-%m-%d %H:%M:%S").to_string()),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<NaiveDate>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::String(value.format("%Y-%m-%d").to_string()),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<NaiveTime>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::String(value.format("%H:%M:%S").to_string()),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // Try JSON types
        match row.try_get::<Option<serde_json::Value>, _>(index) {
            Ok(Some(value)) => return value,
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // Try string as fallback
        match row.try_get::<Option<String>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::String(value),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // Try Vec<u8> as last resort (for BLOB types)
        match row.try_get::<Option<Vec<u8>>, _>(index) {
            Ok(Some(value)) => {
                // Try to convert to string, fallback to base64
                match String::from_utf8(value) {
                    Ok(s) => return serde_json::Value::String(s),
                    Err(_) => return serde_json::Value::String("BLOB_DATA".to_string()),
                }
            }
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // If all else fails, return null
        serde_json::Value::Null
    }

    // Extract value from SQLite row
    fn extract_value_from_sqlite_row(&self, row: &sqlx::sqlite::SqliteRow, index: usize) -> serde_json::Value {
        // Try different data types in order of preference
        match row.try_get::<Option<i64>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::Number(serde_json::Number::from(value)),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<i32>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::Number(serde_json::Number::from(value)),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<f64>, _>(index) {
            Ok(Some(value)) => {
                if let Some(num) = serde_json::Number::from_f64(value) {
                    return serde_json::Value::Number(num);
                }
            }
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<f32>, _>(index) {
            Ok(Some(value)) => {
                if let Some(num) = serde_json::Number::from_f64(value as f64) {
                    return serde_json::Value::Number(num);
                }
            }
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<bool>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::Bool(value),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // Try datetime types
        match row.try_get::<Option<NaiveDateTime>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::String(value.format("%Y-%m-%d %H:%M:%S").to_string()),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<NaiveDate>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::String(value.format("%Y-%m-%d").to_string()),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        match row.try_get::<Option<NaiveTime>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::String(value.format("%H:%M:%S").to_string()),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // Try JSON types
        match row.try_get::<Option<serde_json::Value>, _>(index) {
            Ok(Some(value)) => return value,
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // Try string as fallback
        match row.try_get::<Option<String>, _>(index) {
            Ok(Some(value)) => return serde_json::Value::String(value),
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // Try Vec<u8> as last resort (for BLOB types)
        match row.try_get::<Option<Vec<u8>>, _>(index) {
            Ok(Some(value)) => {
                // Try to convert to string, fallback to base64
                match String::from_utf8(value) {
                    Ok(s) => return serde_json::Value::String(s),
                    Err(_) => return serde_json::Value::String("BLOB_DATA".to_string()),
                }
            }
            Ok(None) => return serde_json::Value::Null,
            Err(_) => {}
        }
        
        // If all else fails, return null
        serde_json::Value::Null
    }

    pub async fn new(config: &crate::DatabaseConfig) -> Result<Self, AppError> {
        let connection_string = match config.db_type {
            DatabaseType::MySQL => {
                if config.database.is_empty() {
                    format!(
                        "mysql://{}:{}@{}:{}",
                        config.username, config.password, config.host, config.port
                    )
                } else {
                    format!(
                        "mysql://{}:{}@{}:{}/{}",
                        config.username, config.password, config.host, config.port, config.database
                    )
                }
            }
            DatabaseType::PostgreSQL => {
                if config.database.is_empty() {
                    format!(
                        "postgresql://{}:{}@{}:{}",
                        config.username, config.password, config.host, config.port
                    )
                } else {
                    format!(
                        "postgresql://{}:{}@{}:{}/{}",
                        config.username, config.password, config.host, config.port, config.database
                    )
                }
            }
            DatabaseType::SQLite => {
                if config.database.is_empty() {
                    return Err(AppError::InvalidConfiguration("SQLite requires a database file path".to_string()));
                }
                format!("sqlite://{}", config.database)
            }
            DatabaseType::MongoDB => {
                if config.database.is_empty() {
                    format!(
                        "mongodb://{}:{}@{}:{}",
                        config.username, config.password, config.host, config.port
                    )
                } else {
                    format!(
                        "mongodb://{}:{}@{}:{}/{}",
                        config.username, config.password, config.host, config.port, config.database
                    )
                }
            }
        };

        match config.db_type {
            DatabaseType::MySQL => {
                let pool = MySqlPool::connect(&connection_string).await?;
                Ok(DatabaseConnection::MySQL(pool))
            }
            DatabaseType::PostgreSQL => {
                let pool = PgPool::connect(&connection_string).await?;
                Ok(DatabaseConnection::PostgreSQL(pool))
            }
            DatabaseType::SQLite => {
                let pool = SqlitePool::connect(&connection_string).await?;
                Ok(DatabaseConnection::SQLite(pool))
            }
            DatabaseType::MongoDB => {
                let client = Client::with_uri_str(&connection_string).await?;
                let database_name = if config.database.is_empty() {
                    "admin" // Default database for MongoDB when no specific database is provided
                } else {
                    &config.database
                };
                let database = client.database(database_name);
                Ok(DatabaseConnection::MongoDB(client, database))
            }
        }
    }

    pub async fn test_connection(&self) -> Result<(), AppError> {
        match self {
            DatabaseConnection::MySQL(pool) => {
                sqlx::query("SELECT 1").fetch_one(pool).await?;
            }
            DatabaseConnection::PostgreSQL(pool) => {
                sqlx::query("SELECT 1").fetch_one(pool).await?;
            }
            DatabaseConnection::SQLite(pool) => {
                sqlx::query("SELECT 1").fetch_one(pool).await?;
            }
            DatabaseConnection::MongoDB(_, database) => {
                // Test MongoDB connection by listing collections
                let _collections = database.list_collection_names(None).await?;
            }
        }
        Ok(())
    }

    pub async fn get_schema(&self) -> Result<DatabaseSchema, AppError> {
        let tables = match self {
            DatabaseConnection::MySQL(pool) => {
                self.get_mysql_schema(pool).await?
            }
            DatabaseConnection::PostgreSQL(pool) => {
                self.get_postgresql_schema(pool).await?
            }
            DatabaseConnection::SQLite(pool) => {
                self.get_sqlite_schema(pool).await?
            }
            DatabaseConnection::MongoDB(client, database) => {
                self.get_mongodb_schema(client, database).await?
            }
        };

        Ok(DatabaseSchema { tables })
    }

    async fn get_mysql_schema(&self, pool: &MySqlPool) -> Result<Vec<TableInfo>, AppError> {
        let tables_query = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()";
        let table_rows = sqlx::query(tables_query).fetch_all(pool).await?;
        
        let mut tables = Vec::new();
        
        for row in table_rows {
            let table_name: String = row.get("TABLE_NAME");
            
            let columns_query = r#"
                SELECT 
                    COLUMN_NAME,
                    DATA_TYPE,
                    IS_NULLABLE,
                    COLUMN_KEY
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION
            "#;
            
            let column_rows = sqlx::query(columns_query)
                .bind(&table_name)
                .fetch_all(pool)
                .await?;
            
            let mut columns = Vec::new();
            for col_row in column_rows {
                let column_name: String = col_row.get("COLUMN_NAME");
                let data_type: String = col_row.get("DATA_TYPE");
                let is_nullable: String = col_row.get("IS_NULLABLE");
                let column_key: String = col_row.get("COLUMN_KEY");
                
                columns.push(ColumnInfo {
                    name: column_name,
                    data_type,
                    is_nullable: is_nullable == "YES",
                    is_primary_key: column_key == "PRI",
                });
            }
            
            tables.push(TableInfo {
                name: table_name,
                columns,
            });
        }
        
        Ok(tables)
    }

    async fn get_postgresql_schema(&self, pool: &PgPool) -> Result<Vec<TableInfo>, AppError> {
        let tables_query = r#"
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        "#;
        let table_rows = sqlx::query(tables_query).fetch_all(pool).await?;
        
        let mut tables = Vec::new();
        
        for row in table_rows {
            let table_name: String = row.get("table_name");
            
            let columns_query = r#"
                SELECT 
                    column_name,
                    data_type,
                    is_nullable,
                    CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
                FROM information_schema.columns c
                LEFT JOIN (
                    SELECT ku.table_name, ku.column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage ku
                        ON tc.constraint_name = ku.constraint_name
                        AND tc.table_schema = ku.table_schema
                    WHERE tc.constraint_type = 'PRIMARY KEY'
                ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
                WHERE c.table_name = $1
                ORDER BY c.ordinal_position
            "#;
            
            let column_rows = sqlx::query(columns_query)
                .bind(&table_name)
                .fetch_all(pool)
                .await?;
            
            let mut columns = Vec::new();
            for col_row in column_rows {
                let column_name: String = col_row.get("column_name");
                let data_type: String = col_row.get("data_type");
                let is_nullable: String = col_row.get("is_nullable");
                let is_primary_key: bool = col_row.get("is_primary_key");
                
                columns.push(ColumnInfo {
                    name: column_name,
                    data_type,
                    is_nullable: is_nullable == "YES",
                    is_primary_key,
                });
            }
            
            tables.push(TableInfo {
                name: table_name,
                columns,
            });
        }
        
        Ok(tables)
    }

    async fn get_sqlite_schema(&self, pool: &SqlitePool) -> Result<Vec<TableInfo>, AppError> {
        let tables_query = "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
        let table_rows = sqlx::query(tables_query).fetch_all(pool).await?;
        
        let mut tables = Vec::new();
        
        for row in table_rows {
            let table_name: String = row.get("name");
            
            let columns_query = format!("PRAGMA table_info({})", table_name);
            let column_rows = sqlx::query(&columns_query).fetch_all(pool).await?;
            
            let mut columns = Vec::new();
            for col_row in column_rows {
                let _cid: i32 = col_row.get("cid");
                let column_name: String = col_row.get("name");
                let data_type: String = col_row.get("type");
                let not_null: i32 = col_row.get("notnull");
                let pk: i32 = col_row.get("pk");
                
                columns.push(ColumnInfo {
                    name: column_name,
                    data_type,
                    is_nullable: not_null == 0,
                    is_primary_key: pk == 1,
                });
            }
            
            tables.push(TableInfo {
                name: table_name,
                columns,
            });
        }
        
        Ok(tables)
    }

    pub async fn execute_query(&self, query: &str) -> Result<QueryResult, AppError> {
        match self {
            DatabaseConnection::MySQL(pool) => {
                self.execute_mysql_query(pool, query).await
            }
            DatabaseConnection::PostgreSQL(pool) => {
                self.execute_postgresql_query(pool, query).await
            }
            DatabaseConnection::SQLite(pool) => {
                self.execute_sqlite_query(pool, query).await
            }
            DatabaseConnection::MongoDB(client, database) => {
                self.execute_mongodb_query(client, database, query).await
            }
        }
    }

    async fn execute_mysql_query(&self, pool: &MySqlPool, query: &str) -> Result<QueryResult, AppError> {
        println!("Executing MySQL query: {}", query);
        
        let rows = match sqlx::query(query).fetch_all(pool).await {
            Ok(rows) => rows,
            Err(e) => {
                println!("MySQL query error: {}", e);
                return Err(AppError::QueryExecutionFailed(format!("MySQL query failed: {}", e)));
            }
        };
        
        if rows.is_empty() {
            return Ok(QueryResult {
                columns: vec![],
                rows: vec![],
                row_count: 0,
            });
        }
        
        let columns: Vec<String> = rows[0].columns().iter().map(|c| c.name().to_string()).collect();
        let mut result_rows = Vec::new();
        let row_count = rows.len();
        
        for row in &rows {
            let mut row_data = Vec::new();
            for i in 0..columns.len() {
                let value = self.extract_value_from_mysql_row(row, i);
                row_data.push(value);
            }
            result_rows.push(row_data);
        }
        
        println!("MySQL query executed successfully, {} rows returned", row_count);
        Ok(QueryResult {
            columns,
            rows: result_rows,
            row_count,
        })
    }

    async fn execute_postgresql_query(&self, pool: &PgPool, query: &str) -> Result<QueryResult, AppError> {
        println!("Executing PostgreSQL query: {}", query);
        
        let rows = match sqlx::query(query).fetch_all(pool).await {
            Ok(rows) => rows,
            Err(e) => {
                println!("PostgreSQL query error: {}", e);
                return Err(AppError::QueryExecutionFailed(format!("PostgreSQL query failed: {}", e)));
            }
        };
        
        if rows.is_empty() {
            return Ok(QueryResult {
                columns: vec![],
                rows: vec![],
                row_count: 0,
            });
        }
        
        let columns: Vec<String> = rows[0].columns().iter().map(|c| c.name().to_string()).collect();
        let mut result_rows = Vec::new();
        let row_count = rows.len();
        
        for row in &rows {
            let mut row_data = Vec::new();
            for i in 0..columns.len() {
                let value = self.extract_value_from_postgresql_row(row, i);
                row_data.push(value);
            }
            result_rows.push(row_data);
        }
        
        Ok(QueryResult {
            columns,
            rows: result_rows,
            row_count,
        })
    }

    async fn execute_sqlite_query(&self, pool: &SqlitePool, query: &str) -> Result<QueryResult, AppError> {
        println!("Executing SQLite query: {}", query);
        
        let rows = match sqlx::query(query).fetch_all(pool).await {
            Ok(rows) => rows,
            Err(e) => {
                println!("SQLite query error: {}", e);
                return Err(AppError::QueryExecutionFailed(format!("SQLite query failed: {}", e)));
            }
        };
        
        if rows.is_empty() {
            return Ok(QueryResult {
                columns: vec![],
                rows: vec![],
                row_count: 0,
            });
        }
        
        let columns: Vec<String> = rows[0].columns().iter().map(|c| c.name().to_string()).collect();
        let mut result_rows = Vec::new();
        let row_count = rows.len();
        
        for row in &rows {
            let mut row_data = Vec::new();
            for i in 0..columns.len() {
                let value = self.extract_value_from_sqlite_row(row, i);
                row_data.push(value);
            }
            result_rows.push(row_data);
        }
        
        Ok(QueryResult {
            columns,
            rows: result_rows,
            row_count,
        })
    }

    async fn get_mongodb_schema(&self, _client: &Client, database: &MongoDatabase) -> Result<Vec<TableInfo>, AppError> {
        let collections = database.list_collection_names(None).await?;
        let mut tables = Vec::new();

        for collection_name in collections {
            // Get sample document to infer schema
            let collection = database.collection::<bson::Document>(&collection_name);
            let sample_doc = collection.find_one(None, None).await?;
            
            let mut columns = Vec::new();
            if let Some(doc) = sample_doc {
                for (key, value) in doc {
                    let data_type = match value {
                        bson::Bson::String(_) => "String",
                        bson::Bson::Int32(_) => "Int32",
                        bson::Bson::Int64(_) => "Int64",
                        bson::Bson::Double(_) => "Double",
                        bson::Bson::Boolean(_) => "Boolean",
                        bson::Bson::DateTime(_) => "DateTime",
                        bson::Bson::ObjectId(_) => "ObjectId",
                        bson::Bson::Array(_) => "Array",
                        bson::Bson::Document(_) => "Document",
                        _ => "Unknown",
                    };
                    
                    columns.push(ColumnInfo {
                        name: key.to_string(),
                        data_type: data_type.to_string(),
                        is_primary_key: key == "_id",
                        is_nullable: true,
                    });
                }
            }

            tables.push(TableInfo {
                name: collection_name,
                columns,
            });
        }

        Ok(tables)
    }

    async fn execute_mongodb_query(&self, _client: &Client, database: &MongoDatabase, _query: &str) -> Result<QueryResult, AppError> {
        // Simple MongoDB query execution
        // For now, just return a basic result
        // In a real implementation, you'd parse the query and execute it
        
        let collections = database.list_collection_names(None).await?;
        
        let columns = vec!["collection".to_string(), "count".to_string()];

        let mut rows = Vec::new();
        for collection_name in collections {
            let collection = database.collection::<bson::Document>(&collection_name);
            let count = collection.count_documents(None, None).await?;
            
            let mut row = Vec::new();
            row.push(serde_json::Value::String(collection_name));
            row.push(serde_json::Value::Number(serde_json::Number::from(count)));
            rows.push(row);
        }

        let row_count = rows.len();
        Ok(QueryResult {
            columns,
            rows,
            row_count,
        })
    }

    pub async fn list_databases(&self) -> Result<Vec<String>, AppError> {
        match self {
            DatabaseConnection::MySQL(pool) => {
                let rows = sqlx::query("SHOW DATABASES").fetch_all(pool).await?;
                let databases: Vec<String> = rows.iter()
                    .map(|row| row.get::<String, _>("Database"))
                    .collect();
                Ok(databases)
            }
            DatabaseConnection::PostgreSQL(pool) => {
                let rows = sqlx::query("SELECT datname FROM pg_database WHERE datistemplate = false")
                    .fetch_all(pool).await?;
                let databases: Vec<String> = rows.iter()
                    .map(|row| row.get::<String, _>("datname"))
                    .collect();
                Ok(databases)
            }
            DatabaseConnection::SQLite(_pool) => {
                // SQLite doesn't have multiple databases concept
                Ok(vec!["main".to_string()])
            }
            DatabaseConnection::MongoDB(client, _database) => {
                let databases = client.list_database_names(None, None).await?;
                Ok(databases)
            }
        }
    }

    pub async fn list_collections(&self) -> Result<Vec<String>, AppError> {
        match self {
            DatabaseConnection::MySQL(pool) => {
                let rows = sqlx::query("SHOW TABLES").fetch_all(pool).await?;
                let tables: Vec<String> = rows.iter()
                    .map(|row| {
                        let table_name: String = row.get(0);
                        table_name
                    })
                    .collect();
                Ok(tables)
            }
            DatabaseConnection::PostgreSQL(pool) => {
                let rows = sqlx::query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
                    .fetch_all(pool).await?;
                let tables: Vec<String> = rows.iter()
                    .map(|row| row.get::<String, _>("tablename"))
                    .collect();
                Ok(tables)
            }
            DatabaseConnection::SQLite(pool) => {
                let rows = sqlx::query("SELECT name FROM sqlite_master WHERE type='table'")
                    .fetch_all(pool).await?;
                let tables: Vec<String> = rows.iter()
                    .map(|row| row.get::<String, _>("name"))
                    .collect();
                Ok(tables)
            }
            DatabaseConnection::MongoDB(_client, database) => {
                let collections = database.list_collection_names(None).await?;
                Ok(collections)
            }
        }
    }
}
