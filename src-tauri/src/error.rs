use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug, Serialize, Deserialize)]
pub enum AppError {
    #[error("Database connection failed: {0}")]
    DatabaseConnectionFailed(String),
    
    #[error("Database not connected")]
    DatabaseNotConnected,
    
    #[error("Query execution failed: {0}")]
    QueryExecutionFailed(String),
    
    #[error("Schema retrieval failed: {0}")]
    SchemaRetrievalFailed(String),
    
    #[error("Invalid configuration: {0}")]
    InvalidConfiguration(String),
    
    #[error("AI service error: {0}")]
    AIServiceError(String),
    
    #[error("AI error: {0}")]
    AIError(String),
    
    #[error("Internal error: {0}")]
    InternalError(String),
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError::DatabaseConnectionFailed(err.to_string())
    }
}

impl From<anyhow::Error> for AppError {
    fn from(err: anyhow::Error) -> Self {
        AppError::InternalError(err.to_string())
    }
}

impl From<mongodb::error::Error> for AppError {
    fn from(err: mongodb::error::Error) -> Self {
        AppError::DatabaseConnectionFailed(err.to_string())
    }
}
