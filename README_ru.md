# n8n ElevenLabs Telemarketing Orchestrator

Шаблон workflow для n8n, который управляет исходящими голосовыми AI-звонками
между очередью телемаркетинга в CRM с SOAP API и ElevenLabs Conversational AI.

Workflow получает контакты из очереди, блокирует записи перед набором номера,
запускает исходящие SIP-звонки, обрабатывает callback-запросы ElevenLabs,
сопоставляет результаты звонков со статусами CRM и при необходимости
автоматически продолжает обработку очереди.

> [!IMPORTANT]
> Этот репозиторий представляет собой прототип и пример интеграции. Проект не
> заявлен как полностью готовое production-решение и не проверен со всеми
> возможными конфигурациями CRM и аккаунтов ElevenLabs.

## Архитектура

```text
Webhook start/continue
        |
        v
Получение очереди CRM -> фильтрация записей -> блокировка в CRM
                                                |
                                                v
                                  Исходящий звонок ElevenLabs
                                                |
                                                v
Callback ElevenLabs -> определение результата -> финальный статус в CRM
                                                |
                                                v
                                  автоматическое продолжение
```

Подробное описание потока находится в
[docs/architecture.md](docs/architecture.md).

## Возможности

- Команды управления `start`, `continue`, `stop`, `resume` и статусами
- Получение очереди CRM через SOAP API
- Необязательная фильтрация по `userID`
- Приоритет запланированных обратных звонков
- До трёх параллельных запусков звонков за одно выполнение workflow
- Блокировка записи CRM перед исходящим звонком
- Создание исходящих SIP-звонков через ElevenLabs
- Связывание callback с исходным звонком через metadata и static data n8n
- Настраиваемое сопоставление результатов звонков со статусами CRM
- Разблокировка и восстановление после ошибки запуска звонка
- Автоматическое продолжение очереди после callback
- Stop-флаги с учётом запуска: старый флаг не блокирует новый запуск

## Содержимое репозитория

```text
.
|-- README.md
|-- README_ru.md
|-- workflows/
|   `-- telemarketing-elevenlabs-template.json
|-- docs/
|   |-- architecture.md
|   |-- setup.md
|   |-- api-contract.md
|   |-- testing-plan.md
|   `-- troubleshooting.md
|-- examples/
|   |-- start.payload.example.json
|   |-- stop.payload.example.json
|   |-- callback.example.json
|   `-- status-map.example.json
|-- scripts/
|   `-- sanitize-workflow.js
|-- .env.example
|-- .gitignore
`-- LICENSE
```

## Требования

- n8n с нодами Code, Webhook, HTTP Request, Set и Manual Trigger
- SOAP API CRM, совместимый с используемыми операциями:
  - `Telemarketing_Outgoing_Get`
  - `Telemarketing_Status_Set`
- Агент ElevenLabs Conversational AI
- Телефонный номер ElevenLabs для исходящих SIP-звонков
- Публичный HTTPS-доступ к callback webhook в n8n

## Быстрый старт

1. Импортируйте
   [workflows/telemarketing-elevenlabs-template.json](workflows/telemarketing-elevenlabs-template.json)
   в n8n.
2. Замените все демонстрационные значения CRM и ElevenLabs.
3. Настройте отправку post-call данных агента ElevenLabs на адрес:
   `https://YOUR_N8N_HOST/webhook/telemarketing-elevenlabs-callback`.
4. Активируйте workflow.
5. Отправьте POST-запрос с параметрами запуска на адрес:
   `https://YOUR_N8N_HOST/webhook/telemarketing-elevenlabs-start`.
6. Проверьте работу на одной тестовой записи перед включением автоматического
   продолжения или параллельных звонков.

Подробная инструкция находится в [docs/setup.md](docs/setup.md).

## Webhook API

Основной webhook принимает JSON, query-параметры и поля верхнего уровня.

```bash
curl -X POST "https://YOUR_N8N_HOST/webhook/telemarketing-elevenlabs-start" \
  -H "Content-Type: application/json" \
  --data @examples/start.payload.example.json
```

Поддерживаемые команды управления:

- `start`
- `continue`
- `resume`
- `stop`
- `save_status_map`
- `show_status_map`
- `reset_status_map`
- `reset_completed`

Описание полей и поведения находится в
[docs/api-contract.md](docs/api-contract.md).

## Сопоставление статусов CRM

Workflow содержит следующие демонстрационные значения по умолчанию:

| Результат | ID статуса CRM |
| --- | ---: |
| `no_answer` | `1` |
| `busy` | `2` |
| `invalid_phone` | `3` |
| `fax` | `4` |
| `answering_machine` | `5` |

Для бизнес-результатов `answered`, `not_interested`, `confirm`, `call_back` и
`failed` необходимо указать идентификаторы статусов из вашей CRM.

## Параллельные звонки и stop-логика

Значение `parallel_calls` ограничено числом `3`. Каждая выбранная запись CRM
становится отдельным item в n8n и проходит собственную цепочку блокировки,
звонка, callback и записи финального статуса.

Команда `stop` предотвращает новые циклы продолжения очереди, но не отменяет
звонки, уже отправленные в ElevenLabs. Stop-записи содержат временные метки,
поэтому последующий явный запуск может начать новую обработку и не будет
заблокирован старым флагом.

## Тестирование

Начните с одной записи, `parallel_calls: 1` и
`auto_continue_after_callback: false`. Перед увеличением нагрузки проверьте
блокировку записи, запрос к ElevenLabs, получение callback и запись финального
статуса в CRM.

Полный поэтапный план находится в
[docs/testing-plan.md](docs/testing-plan.md).

## Безопасность

- Все идентификаторы и учётные данные в workflow являются демонстрационными и
  должны быть заменены.
- Используйте credentials n8n или переменные окружения вместо значений,
  встроенных в Code и HTTP Request ноды.
- Не публикуйте экспорты execution, расшифровки разговоров, телефонные номера и
  данные CRM.
- Защитите оба webhook с помощью аутентификации или проверки подписи.
- Перед публикацией изменённого экспорта выполните:
  `node scripts/sanitize-workflow.js <workflow.json> [output.json]`.

## Известные ограничения

- Формат SOAP-запросов привязан к продемонстрированному контракту CRM.
- Для состояния запусков и связывания callback используется static data n8n.
- Автоматические retry и backoff реализованы не для всех внешних запросов.
- Репозиторий не содержит mock-сервер CRM или полный локальный demo-стенд.
- Для публичного шаблона не был завершён полный end-to-end тест на 100 записях.

## Roadmap

- Перенести все учётные данные в credentials n8n или переменные окружения
- Добавить retry/backoff и тесты идемпотентности
- Добавить mock-сервис SOAP CRM
- Добавить fixtures и автоматические проверки сопоставления статусов
- Хранить состояние звонков вне static data n8n
- Добавить демонстрационное окружение Docker Compose
- Добавить мониторинг активных звонков и операционные dashboards

## Лицензия

[MIT](LICENSE)
