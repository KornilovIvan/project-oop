# Task Management — Microservices

Микросервисное приложение: REST API + React + PostgreSQL в Docker.

## Архитектура

```
Frontend (:5173) → REST → Gateway (:5010) → REST → AuthService (:5001)
                                                   → ProjectService (:5002)
                                                   → TaskService (:5003)
                    PostgreSQL (3 БД: authdb, projectdb, taskdb)
```

## Запуск

```bash
# 1. Запустить все сервисы + PostgreSQL
docker compose up -d --build

# 2. Фронтенд
cd frontend
npm install
cd frontend && npm run dev
```

**Фронтенд:** http://localhost:5173

## Остановка

```bash
docker compose down       # остановить контейнеры
docker compose down -v    # + удалить БД
pkill -f "vite"            # остановить фронтенд
```

## Сервисы

| Сервис | Порт | База | API |
|--------|------|------|-----|
| **AuthService** | 5001 | authdb | `POST /api/auth/register`, `POST /api/auth/login` |
| **ProjectService** | 5002 | projectdb | `GET /api/projects`, `POST /api/projects` |
| **TaskService** | 5003 | taskdb | `GET /api/projects/{id}/tasks`, `POST /api/tasks`, `POST /api/tasks/{id}/status` |
| **ApiGateway** | 5010 | — | Проксирует все запросы на сервисы |

## Структура

```
services/
├── AuthService/          # Аутентификация и пользователи
├── ProjectService/       # Проекты
├── TaskService/          # Задачи и статусы
└── ApiGateway/           # REST прокси (единая точка входа)
frontend/                 # React + TypeScript (Vite)
Proto/                    # gRPC контракты (для будущей сервис-сервис интеграции)
postgres/init.sql         # Инициализация 3 БД
docker-compose.yml        # Оркестрация
```

## Технологии

- **Backend:** .NET 9, ASP.NET Core, PostgreSQL, Entity Framework Core, BCrypt
- **Frontend:** React, TypeScript, Vite
- **Infra:** Docker, Docker Compose, PostgreSQL 15
