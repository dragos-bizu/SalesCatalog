- Back-End:
    - Amazon Web Services
    - Serverless architecture
    - Github Actions for deployment
    - API Gateway with Lambda Functions and DynamoDB for Back-End
    - Keep instances in Free Tier or as minimum as possible
    - Implement Clean Arhictecture and Single Responsabilities
    - Use AWS Cognito for Admin Login (I want Apple and Google possibilities)
- Front-End:
    - Implement Clean Arhictecture and Single Responsabilities, you can use Managers Pattern
    - React for Front-End
    - S3 for React App
    - Use AWS Cognito for Admin Login (I want Apple and Google possibilities)
- Infrastructure
    - Use AWS SAM
    - Structure Idea:
    SalesCatalog/
    ├── .github/
    │   └── workflows/
    │       └── deploy.yml          # Your single CI/CD pipeline file
    ├── src/
    │   ├── shared/                 # Code used by multiple Lambdas
    │   │   ├── db.js               # DynamoDB client configuration
    │   │   └── auth.js             # Admin authorization logic
    │   ├── lambdas/                # Individual function logic
    │   │   ├── getProducts.js
    │   │   ├── createProduct.js
    │   │   └── deleteProduct.js
    ├── ui/                   # Optional: Your S3/CloudFront web app code
    ├── serverless.yml              # (or template.yaml) Defines all infrastructure
    └── package.json

