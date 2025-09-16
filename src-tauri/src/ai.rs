use reqwest;
use serde::{Deserialize, Serialize};
use serde_json::json;
use anyhow::{Result, anyhow};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIProviderConfig {
    pub provider: String,
    pub api_key: Option<String>,
    pub base_url: Option<String>,
    pub model: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConsultRequest {
    pub question: String,
    pub schema_description: String,
    pub ai_config: AIProviderConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateSQLRequest {
    pub natural_language_query: String,
    pub schema_description: String,
    pub ai_config: AIProviderConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateDiagramRequest {
    pub schema_description: String,
    pub ai_config: AIProviderConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateInsightsRequest {
    pub query_result: Option<serde_json::Value>,
    pub schema: Option<serde_json::Value>,
    pub ai_config: AIProviderConfig,
}

pub struct AIService;

impl AIService {
    pub async fn consult_database(&self, request: ConsultRequest) -> Result<String> {
        let prompt = self.create_consult_prompt(&request.question, &request.schema_description);
        self.call_ai_provider(&request.ai_config, &prompt).await
    }

    pub async fn generate_sql(&self, request: GenerateSQLRequest) -> Result<String> {
        let prompt = self.create_sql_prompt(&request.natural_language_query, &request.schema_description);
        let response = self.call_ai_provider(&request.ai_config, &prompt).await?;
        self.clean_sql_from_markdown(&response)
    }

    pub async fn generate_diagram(&self, request: GenerateDiagramRequest) -> Result<String> {
        let prompt = self.create_diagram_prompt(&request.schema_description);
        let response = self.call_ai_provider(&request.ai_config, &prompt).await?;
        self.clean_mermaid_from_markdown(&response)
    }

    pub async fn generate_insights(&self, request: GenerateInsightsRequest) -> Result<String> {
        let prompt = self.create_insights_prompt(&request.query_result, &request.schema);
        self.call_ai_provider(&request.ai_config, &prompt).await
    }

    async fn call_ai_provider(&self, config: &AIProviderConfig, prompt: &str) -> Result<String> {
        match config.provider.as_str() {
            "openai" => self.call_openai(prompt, &config.model, &config.api_key.as_ref().unwrap()).await,
            "gemini" => self.call_gemini(prompt, &config.model, &config.api_key.as_ref().unwrap()).await,
            "anthropic" => self.call_anthropic(prompt, &config.model, &config.api_key.as_ref().unwrap()).await,
            "ollama" => self.call_ollama(prompt, &config.model, &config.base_url.as_ref().unwrap()).await,
            _ => Err(anyhow!("Unsupported AI provider: {}", config.provider)),
        }
    }

    pub async fn call_openai(&self, prompt: &str, model: &str, api_key: &str) -> Result<String> {
        let client = reqwest::Client::new();
        
        let request_body = json!({
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1000
        });

        let response = client
            .post("https://api.openai.com/v1/chat/completions")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow!("OpenAI API error: {}", response.status()));
        }

        let response_json: serde_json::Value = response.json().await?;
        let content = response_json["choices"][0]["message"]["content"]
            .as_str()
            .ok_or_else(|| anyhow!("No content in OpenAI response"))?;

        Ok(content.to_string())
    }

    pub async fn call_gemini(&self, prompt: &str, model: &str, api_key: &str) -> Result<String> {
        let client = reqwest::Client::new();
        
        let request_body = json!({
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ]
        });

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            model, api_key
        );

        let response = client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow!("Gemini API error: {}", response.status()));
        }

        let response_json: serde_json::Value = response.json().await?;
        let content = response_json["candidates"][0]["content"]["parts"][0]["text"]
            .as_str()
            .ok_or_else(|| anyhow!("No content in Gemini response"))?;

        Ok(content.to_string())
    }

    pub async fn call_anthropic(&self, prompt: &str, model: &str, api_key: &str) -> Result<String> {
        let client = reqwest::Client::new();
        
        let request_body = json!({
            "model": model,
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        });

        let response = client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", api_key)
            .header("Content-Type", "application/json")
            .header("anthropic-version", "2023-06-01")
            .json(&request_body)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow!("Anthropic API error: {}", response.status()));
        }

        let response_json: serde_json::Value = response.json().await?;
        let content = response_json["content"][0]["text"]
            .as_str()
            .ok_or_else(|| anyhow!("No content in Anthropic response"))?;

        Ok(content.to_string())
    }

    pub async fn call_ollama(&self, prompt: &str, model: &str, base_url: &str) -> Result<String> {
        let client = reqwest::Client::new();
        
        let request_body = json!({
            "model": model,
            "prompt": prompt,
            "stream": false
        });

        let url = format!("{}/api/generate", base_url);

        let response = client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(anyhow!("Ollama API error: {}", response.status()));
        }

        let response_json: serde_json::Value = response.json().await?;
        let content = response_json["response"]
            .as_str()
            .ok_or_else(|| anyhow!("No content in Ollama response"))?;

        Ok(content.to_string())
    }

    fn create_consult_prompt(&self, question: &str, schema: &str) -> String {
        format!(
            "Anda adalah seorang ahli database. Jawablah pertanyaan berikut tentang skema database dalam bahasa Indonesia dengan format markdown yang terstruktur:

Schema:
{}

Pertanyaan: {}

WAJIB gunakan format markdown berikut:

## 📋 Jawaban

[Berikan jawaban yang jelas dan langsung untuk pertanyaan tersebut]

## 🔍 Query SQL

```sql
[Berikan query SQL yang relevan untuk menjawab pertanyaan]
```

## 💡 Wawasan Database

[Berikan wawasan tambahan tentang struktur database yang relevan]

## ⚡ Praktik Terbaik

[Berikan rekomendasi atau praktik terbaik yang terkait dengan pertanyaan]

## 📊 Informasi Tambahan

[Informasi tambahan yang mungkin berguna]

---

**Catatan:** Pastikan semua kode SQL menggunakan syntax yang benar dan sesuai dengan skema database yang tersedia. Gunakan nama tabel dan kolom yang tepat sesuai dengan skema.",
            schema, question
        )
    }

    fn create_sql_prompt(&self, query: &str, schema: &str) -> String {
        format!(
            "Anda adalah ahli SQL. Berdasarkan skema database dan query bahasa alami, buatlah query SQL yang valid.

{}

Query Bahasa Alami: \"{}\"

ATURAN VALIDASI KRITIS:
1. SEBELUM menulis query, periksa dengan teliti skema di atas
2. HANYA gunakan nama tabel yang tercantum dalam skema
3. HANYA gunakan nama kolom yang tercantum di bawah setiap tabel dalam skema
4. Jika tabel atau kolom tidak ada dalam skema, JANGAN gunakan
5. Saat menggunakan alias tabel (t1, t2, dll), pastikan merujuk ke tabel yang benar
6. Periksa bahwa kondisi JOIN menggunakan kolom yang ada dari kedua tabel
7. Verifikasi bahwa semua kolom SELECT ada dalam tabel yang ditentukan

FORMAT OUTPUT:
- HANYA kembalikan query SQL murni
- TIDAK boleh menggunakan markdown (backticks atau code blocks)
- TIDAK boleh ada penjelasan atau teks lain
- Gunakan sintaks MySQL yang benar
- Contoh: SELECT * FROM tabel;

Query SQL:",
            schema, query
        )
    }

    fn create_diagram_prompt(&self, schema: &str) -> String {
        format!(
            "Buat diagram ER Mermaid untuk skema database berikut dengan SEMUA KOLOM BERWARNA GELAP:

{}

PENTING: SEMUA KOLOM HARUS BERWARNA GELAP, TIDAK ADA WARNA SELINGAN!

PERSYARATAN WAJIB:
1. Gunakan sintaks diagram ER Mermaid yang benar
2. Sertakan SEMUA tabel yang ada dalam skema
3. Tampilkan primary key (PK) dan foreign key (FK) dengan jelas
4. Gunakan nama tabel dan kolom yang sesuai dengan skema
5. Sertakan indikator kardinalitas (1:1, 1:N, N:M) di relasi
6. Buat diagram yang mudah dibaca dan terstruktur dengan baik
7. Gunakan format: erDiagram
8. Tampilkan tipe data untuk setiap kolom
9. SEMUA KOLOM HARUS BERWARNA GELAP KONSISTEN

LARANGAN KETAT - WAJIB DIPATUHI:
- JANGAN gunakan classDef atau styling apapun
- JANGAN gunakan fill:#f9f atau warna terang lainnya
- JANGAN gunakan stroke:#333 atau warna abu-abu terang
- JANGAN gunakan stroke-width yang tipis
- JANGAN gunakan baris classDef default fill:#f9f,stroke:#333,stroke-width:2px;
- JANGAN gunakan styling apapun selain erDiagram murni
- JANGAN gunakan warna selingan untuk kolom

FORMAT OUTPUT:
- HANYA keluarkan kode diagram Mermaid murni
- TIDAK boleh ada penjelasan atau teks lain
- TIDAK boleh menggunakan markdown (backticks atau code blocks)
- Mulai dengan \"erDiagram\"
- Gunakan sintaks yang benar untuk relasi
- JANGAN gunakan mermaid atau di awal dan akhir
- JANGAN gunakan classDef atau styling apapun

Contoh format:
erDiagram
    TABLE1 {{
        int id PK
        string name
    }}
    TABLE2 {{
        int id PK
        int table1_id FK
        string description
    }}
    TABLE1 ||--o{{ TABLE2 : \"relasi\"

Diagram Mermaid:",
            schema
        )
    }

    fn create_insights_prompt(&self, query_result: &Option<serde_json::Value>, schema: &Option<serde_json::Value>) -> String {
        if let Some(result) = query_result {
            // QueryResult analysis
            format!(
                "Analisis hasil query berikut dan berikan wawasan dalam bahasa Indonesia:

Data: {}

Silakan berikan:
1. Temuan utama dari data
2. Pola atau tren yang diamati
3. Rekomendasi berdasarkan hasil
4. Potensi masalah atau anomali

Berikan respons yang ringkas dan dapat ditindaklanjuti dalam bahasa Indonesia.",
                serde_json::to_string_pretty(result).unwrap_or_default()
            )
        } else if let Some(schema) = schema {
            // Schema analysis
            format!(
                "Analisis skema database berikut dan berikan wawasan dalam bahasa Indonesia:

Database Schema: {}

Silakan berikan:
1. Analisis struktur database
2. Relasi antar tabel
3. Tipe data dan constraint
4. Peluang optimasi
5. Rekomendasi untuk desain database
6. Saran query untuk mengeksplorasi data

Berikan respons yang ringkas dan dapat ditindaklanjuti dalam bahasa Indonesia.",
                serde_json::to_string_pretty(schema).unwrap_or_default()
            )
        } else {
            "Tidak ada data yang tersedia untuk dianalisis.".to_string()
        }
    }

    fn clean_sql_from_markdown(&self, sql: &str) -> Result<String> {
        let cleaned = sql
            .replace("```sql", "")
            .replace("```", "")
            .trim()
            .to_string();
        Ok(cleaned)
    }

    fn clean_mermaid_from_markdown(&self, diagram: &str) -> Result<String> {
        let cleaned = diagram
            .replace("```mermaid", "")
            .replace("```", "")
            .trim()
            .to_string();
        Ok(cleaned)
    }
}
