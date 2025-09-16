// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod database;
mod error;
mod ai;

use database::{DatabaseConnection, DatabaseType, QueryResult, DatabaseSchema as DbSchema};
use error::AppError;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;
use ai::{AIService, ConsultRequest, GenerateSQLRequest, GenerateDiagramRequest, GenerateInsightsRequest};

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


#[derive(Debug, Default)]
pub struct AppData {
    pub db_connection: Option<DatabaseConnection>,
    pub db_config: Option<DatabaseConfig>,
    pub ai_config: Option<ai::AIProviderConfig>,
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
    config: ai::AIProviderConfig,
    state: State<'_, Mutex<AppData>>,
) -> Result<String, AppError> {
    let mut app_data = state.lock().unwrap();
    app_data.ai_config = Some(config);
    Ok("AI configuration saved".to_string())
}

#[tauri::command]
async fn get_ai_config(state: State<'_, Mutex<AppData>>) -> Result<Option<ai::AIProviderConfig>, AppError> {
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

// AI Commands
#[tauri::command]
async fn consult_database(
    request: ConsultRequest,
    state: State<'_, Mutex<AppData>>,
) -> Result<String, AppError> {
    let ai_service = AIService;
    ai_service.consult_database(request).await
        .map_err(|e| AppError::AIError(e.to_string()))
}

#[tauri::command]
async fn generate_sql(
    request: GenerateSQLRequest,
    state: State<'_, Mutex<AppData>>,
) -> Result<String, AppError> {
    let ai_service = AIService;
    ai_service.generate_sql(request).await
        .map_err(|e| AppError::AIError(e.to_string()))
}

#[tauri::command]
async fn generate_diagram(
    request: GenerateDiagramRequest,
    state: State<'_, Mutex<AppData>>,
) -> Result<String, AppError> {
    let ai_service = AIService;
    ai_service.generate_diagram(request).await
        .map_err(|e| AppError::AIError(e.to_string()))
}

#[tauri::command]
async fn generate_insights(
    request: GenerateInsightsRequest,
    state: State<'_, Mutex<AppData>>,
) -> Result<String, AppError> {
    let ai_service = AIService;
    ai_service.generate_insights(request).await
        .map_err(|e| AppError::AIError(e.to_string()))
}

#[tauri::command]
async fn validate_ai_key(
    config: ai::AIProviderConfig,
    state: State<'_, Mutex<AppData>>,
) -> Result<bool, AppError> {
    let ai_service = AIService;
    let test_prompt = "Hello";
    
    match config.provider.as_str() {
        "openai" => {
            if let Some(api_key) = &config.api_key {
                ai_service.call_openai(test_prompt, &config.model, api_key).await
                    .map(|_| true)
                    .map_err(|e| AppError::AIError(e.to_string()))
            } else {
                Err(AppError::AIError("API key required for OpenAI".to_string()))
            }
        }
        "gemini" => {
            if let Some(api_key) = &config.api_key {
                ai_service.call_gemini(test_prompt, &config.model, api_key).await
                    .map(|_| true)
                    .map_err(|e| AppError::AIError(e.to_string()))
            } else {
                Err(AppError::AIError("API key required for Gemini".to_string()))
            }
        }
        "anthropic" => {
            if let Some(api_key) = &config.api_key {
                ai_service.call_anthropic(test_prompt, &config.model, api_key).await
                    .map(|_| true)
                    .map_err(|e| AppError::AIError(e.to_string()))
            } else {
                Err(AppError::AIError("API key required for Anthropic".to_string()))
            }
        }
        "ollama" => {
            if let Some(base_url) = &config.base_url {
                ai_service.call_ollama(test_prompt, &config.model, base_url).await
                    .map(|_| true)
                    .map_err(|e| AppError::AIError(e.to_string()))
            } else {
                Err(AppError::AIError("Base URL required for Ollama".to_string()))
            }
        }
        _ => Err(AppError::AIError("Unsupported AI provider".to_string()))
    }
}

#[tauri::command]
async fn get_available_models(
    config: ai::AIProviderConfig,
    state: State<'_, Mutex<AppData>>,
) -> Result<Vec<String>, AppError> {
    match config.provider.as_str() {
        "openai" => Ok(vec![
            "gpt-4o".to_string(),
            "gpt-4o-mini".to_string(),
            "gpt-4-turbo".to_string(),
            "gpt-4".to_string(),
            "gpt-3.5-turbo".to_string(),
            "gpt-3.5-turbo-16k".to_string(),
        ]),
        "gemini" => Ok(vec![
            "gemini-1.5-pro".to_string(),
            "gemini-1.5-flash".to_string(),
            "gemini-1.0-pro".to_string(),
        ]),
        "anthropic" => Ok(vec![
            "claude-3-5-sonnet-20241022".to_string(),
            "claude-3-5-haiku-20241022".to_string(),
            "claude-3-opus-20240229".to_string(),
            "claude-3-sonnet-20240229".to_string(),
            "claude-3-haiku-20240307".to_string(),
        ]),
        "ollama" => {
            if let Some(base_url) = &config.base_url {
                let client = reqwest::Client::new();
                let response = client
                    .get(&format!("{}/api/tags", base_url))
                    .send()
                    .await
                    .map_err(|e| AppError::AIError(e.to_string()))?;
                
                if response.status().is_success() {
                    let data: serde_json::Value = response.json().await
                        .map_err(|e| AppError::AIError(e.to_string()))?;
                    
                    let models: Vec<String> = data["models"]
                        .as_array()
                        .unwrap_or(&vec![])
                        .iter()
                        .filter_map(|model| model["name"].as_str().map(|s| s.to_string()))
                        .collect();
                    
                    Ok(models)
                } else {
                    Ok(vec![])
                }
            } else {
                Ok(vec![])
            }
        }
        _ => Ok(vec![])
    }
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
            list_collections,
            consult_database,
            generate_sql,
            generate_diagram,
            generate_insights,
            validate_ai_key,
            get_available_models
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
