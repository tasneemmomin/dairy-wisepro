# API Documentation

## Auth Endpoints (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/register` | Register new customer. Requires `name`, `email`, `password`. | No |
| `POST` | `/login` | Authenticate and retrieve JWT token. | No |
| `GET`  | `/me` | Get currently logged-in user profile. | Yes |
| `PUT`  | `/profile` | Update current user details. | Yes |
| `POST` | `/logout` | Log out. | Yes |

## Payment Endpoints (`/api/payments`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/generate-qr` | Generate a dynamic UPI QR code for an order. | Yes |
| `GET`  | `/pending/all` | Get all payments awaiting manual verification. | Yes (Admin) |
| `GET`  | `/order/:orderId` | Get payment status associated with an order. | Yes |
| `POST` | `/:paymentId/mark-paid` | Customer flags the QR order as "Paid via UPI". | Yes |
| `POST` | `/:paymentId/approve` | Admin approves payment; order confirmed. | Yes (Admin) |
| `POST` | `/:paymentId/reject` | Admin rejects payment; order canceled. | Yes (Admin) |

## Product Endpoints (`/api/products`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET`  | `/` | List all available products (supports `search`, `minPrice`, `category`). | No |
| `POST` | `/` | Add a new product to the catalog. | Yes (Admin) |
| `PUT`  | `/:id` | Update an existing product. | Yes (Admin) |
| `DELETE` | `/:id` | Soft/Hard delete a product. | Yes (Admin) |

## ML Endpoints (`/predict/*` running on ML Service)
Expects cross-origin requests directly to ML Python microservice.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/predict/demand` | Uses time/temperature data to predict raw material needed. |
| `POST` | `/predict/inventory` | Suggests economic order limits to prevent stockouts. |
| `POST` | `/predict/spoilage` | Assesses milk quality metrics to determine safety. |
| `POST` | `/predict/sales` | Provides expected revenue given current monthly markers. |
| `POST` | `/predict/churn` | Suggests retention tactics for irregular subscribers. |
