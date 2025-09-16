// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod error;

use database::{DatabaseConnection, DatabaseType, QueryResult, DatabaseSchema as DbSchema};
use error::AppError;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// Application state

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub database: String,
    pub db_type: DatabaseType,
}

// Use the one from database module

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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AIProviderConfig {
    pub provider: String, // "ollama", "openai", "gemini"
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub model: String,
}

#[derive(Debug, Default)]
pub struct AppData {
    pub db_connection: Option<DatabaseConnection>,
    pub db_config: Option<DatabaseConfig>,
    pub ai_config: Option<AIProviderConfig>,
}

// Tauri commands
#[tauri::command]
async fn connect_database(
    config: DatabaseConfig,
    state: State<'_, Mutex<AppData>>,
) -> Result<String, AppError> {
    let connection = DatabaseConnection::new(&config).await?;
    let _ = connection.test_connection().await?;
    
    {
        let mut app_data = state.lock().unwrap();
        app_data.db_connection = Some(connection);
        app_data.db_config = Some(config);
    }
    
    Ok("Database connected successfully".to_string())
}

#[tauri::command]
async fn get_database_schema(state: State<'_, Mutex<AppData>>) -> Result<DbSchema, AppError> {
    let connection = {
        let app_data = state.lock().unwrap();
        app_data
            .db_connection
            .as_ref()
            .ok_or(AppError::DatabaseNotConnected)?
            .clone()
    };
    
    connection.get_schema().await
}

#[tauri::command]
async fn execute_query(
    query: String,
    state: State<'_, Mutex<AppData>>,
) -> Result<QueryResult, AppError> {
    println!("Tauri execute_query called with: {}", query);
    
    let connection = {
        let app_data = state.lock().unwrap();
        app_data
            .db_connection
            .as_ref()
            .ok_or_else(|| {
                println!("Database not connected");
                AppError::DatabaseNotConnected
            })?
            .clone()
    };
    
    println!("Calling connection.execute_query");
    let result = connection.execute_query(&query).await;
    match &result {
        Ok(query_result) => println!("Query executed successfully, {} rows returned", query_result.row_count),
        Err(e) => println!("Query execution failed: {}", e),
    }
    
    result
}

#[tauri::command]
async fn set_ai_config(
    config: AIProviderConfig,
    state: State<'_, Mutex<AppData>>,
) -> Result<String, AppError> {
    let mut app_data = state.lock().unwrap();
    app_data.ai_config = Some(config);
    Ok("AI configuration saved".to_string())
}

#[tauri::command]
async fn get_ai_config(state: State<'_, Mutex<AppData>>) -> Result<Option<AIProviderConfig>, AppError> {
    let app_data = state.lock().unwrap();
    Ok(app_data.ai_config.clone())
}

#[tauri::command]
async fn get_database_config(state: State<'_, Mutex<AppData>>) -> Result<Option<DatabaseConfig>, AppError> {
    let app_data = state.lock().unwrap();
    Ok(app_data.db_config.clone())
}

#[tauri::command]
async fn disconnect_database(state: State<'_, Mutex<AppData>>) -> Result<String, AppError> {
    let mut app_data = state.lock().unwrap();
    app_data.db_connection = None;
    app_data.db_config = None;
    Ok("Database disconnected".to_string())
}

#[tauri::command]
async fn list_databases(state: State<'_, Mutex<AppData>>) -> Result<Vec<String>, AppError> {
    let connection = {
        let app_data = state.lock().unwrap();
        app_data.db_connection.clone()
    };
    
    let connection = connection.ok_or(AppError::DatabaseNotConnected)?;
    let databases = connection.list_databases().await?;
    Ok(databases)
}

#[tauri::command]
async fn list_collections(state: State<'_, Mutex<AppData>>) -> Result<Vec<String>, AppError> {
    let connection = {
        let app_data = state.lock().unwrap();
        app_data.db_connection.clone()
    };
    
    let connection = connection.ok_or(AppError::DatabaseNotConnected)?;
    let collections = connection.list_collections().await?;
    Ok(collections)
}

fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(AppData::default()))
        .invoke_handler(tauri::generate_handler![
            connect_database,
            get_database_schema,
            execute_query,
            set_ai_config,
            get_ai_config,
            get_database_config,
            disconnect_database,
            list_databases,
            list_collections
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
