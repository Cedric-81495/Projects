Potter Wiki App — Full Stack Overview
A full-stack Harry Potter-themed application built with React (Vite) on the frontend and Node.js (Express) with MongoDB on the backend. 
It supports public and admin users, Google OAuth authentication, and dynamic content rendering from both internal and external APIs.
Role-based access control is now enforced for adminUser and superUser accounts.


backend/
│
├── config/
│   └── db.js                  // MongoDB connection setup
│
├── controllers/              // Handles business logic for each route group
│   ├── adminController.js        // Admin user management logic
│   ├── authController.js         // Login, register, Google OAuth
│   ├── characterController.js    // Character data handling
│   ├── publicController.js       // Public user registration and listing
│   ├── spellController.js        // Spell data handling
│   ├── bookController.js         // Book data handling
│   ├── staffController.js        // Staff data handling
│   ├── studentController.js      // Student data handling
│   └── superadminController.js   // SuperUser account management
│
├── middleware/               // Reusable request guards and utilities
│   ├── authMiddleware.js         // Role-based access control
│   ├── rateLimiter.js            // Optional request throttling
│   └── validateRequest.js        // Input validation wrapper
│
├── models/                   // Mongoose schema definitions
│   ├── Character.js              // Character schema
│   ├── Spell.js                  // Spell schema
│   ├── Staff.js                  // Staff schema
│   ├── Student.js                // Student schema
│   ├── Book.js                   // Book schema
│   └── User.js                   // User schema with roles
│
├── routes/                   // API endpoint definitions
│   ├── adminRoutes.js            // Admin-only routes
│   ├── authRoutes.js             // Auth routes (login, register, Google)
│   ├── bookRoutes.js             // Book-related endpoints
│   ├── characterRoutes.js        // Character-related endpoints
│   ├── publicRoutes.js           // Public user routes
│   ├── registerRoutes.js         // Registration logic (legacy or extended)
│   ├── spellRoutes.js            // Spell-related endpoints
│   ├── staffRoutes.js            // Staff-related endpoints
│   ├── studentRoutes.js          // Student-related endpoints
│   └── superadminRoutes.js       // SuperUser-only routes
│
├── validators/              // Express-validator logic
│   ├── adminValidators.js        // Admin input validation
│   └── registerValidators.js     // Registration input validation
│
├── seeder.js                // Optional data seeding script
├── server.js                // Express app entry point
├── .env                     // Environment variables for local use
├── .env.example             // Template for shared env setup
├── package.json             // Backend dependencies and scripts
├── package-lock.json        // Dependency lockfile
├── README.md                // Project overview and instructions
└── vercel.json              // Deployment config for Vercel

frontend/
│
├── public/
│   └── output.css              // Optional fallback styles
│
├── dist/
│   └── assets/                 // Compiled Vite build output
│       └── (compiled files)
│
├── src/
│   ├── assets/                 // Global images and icons
│   │   └── (global images, icons)
│   ├── routes/                 // Route guards and wrappers
│   │   └── AdminRoute.jsx         // Protects admin-only views
│   ├── components/             // Reusable UI components
│   │   └── (reusable UI components)
│   ├── context/                // Global state management
│   │   └── AuthProvider.jsx       // Auth context provider
│   ├── pages/                  // Route-based views
│   │   └── (route-based views)
│   ├── styles/                 // Tailwind and global styles
│   │   └── (Tailwind global styles)
│   ├── utils/                  // Helper functions
│   │   └── (helper functions)
│   ├── App.jsx                 // Main layout and route config
│   ├── App.css                 // Optional scoped styles
│   └── main.jsx                // React DOM entry point
│
├── .env                     // Frontend environment variables
├── .env.example             // Shared env template
├── .gitignore               // Git exclusions
├── eslint.config.js         // Linting rules
├── index.html               // Vite entry HTML
├── package.json             // Frontend dependencies and scripts
├── package-lock.json        // Dependency lockfile
├── postcss.config.js        // PostCSS setup
├── tailwind.config.js       // Tailwind customization
├── vercel.json              // Deployment config for Vercel
└── vite.config.js           // Vite build configurations


Admin Role Permissions

- adminUser

Cannot self-register, update, or delete
Can view all admins via GET /api/admin/all
Cannot manage other accounts or change roles

- superUser

Can create adminUser and superUser accounts
Can update and delete any adminUser or superUser
Can change roles via PUT /api/admin/super-admins/:id/role
Cannot delete themselves (enforced in controller)
All privileged actions require token and are logged

SuperUser Management

Create superUser

Login with existing superUser
POST /api/admin/super with Bearer token
Delete superUser
Login with superUser
DELETE /api/admin/super-admins/:id
Note: Cannot delete self unless controller check is removed

Update superUser
PUT /api/admin/super-admins/:id
Payload: firstname, lastname, email, role

Create adminUser
POST /api/admin/super-admins/admins
Payload: firstname, lastname, username, email, password

Read adminUser(s)
GET /api/admin/all
Returns array of adminUser and superUser accounts

Update adminUser
PUT /api/admin/super-admins/:id

Payload: firstname, lastname, email, role
Delete adminUser

DELETE /api/admin/super-admins/:id
Returns: { "message": "User deleted successfully" }

Local API Endpoints
Characters: GET /api/characters
Spells: GET /api/spells
Students: GET /api/students
Books: GET /api/books
Staff: GET /api/staff
Auth Register: POST /api/auth/register
Auth Login: POST /api/auth/login
Health Check: GET /
Frontend Dev: http://localhost:5173
Backend Dev: http://localhost:3000

External API References
PotterDB Movies: https://api.potterdb.com/v1/movies
HP API Characters: https://hp-api.onrender.com/api/characters
Characters by House: https://hp-api.onrender.com/api/characters/house/gryffindor
Spells: https://hp-api.onrender.com/api/spells
Students: https://hp-api.onrender.com/api/characters/students
Staff: https://hp-api.onrender.com/api/characters/staff
