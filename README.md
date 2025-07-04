# InVEST Data Portal

Repository for the InVEST Data Portal, built using [Next.js](https://nextjs.org/). The stack is as follows:

- UI library: [ShadCN](https://ui.shadcn.com/) (Still using Tailwind V3)
- Database: PostgreSQL with PostGIS extension. Temp database hosted on [Supabase](https://supabase.com/)
- ORM: [Drizzle](https://orm.drizzle.team/)
- Authentication: [Better Auth](https://www.better-auth.com/)
- Map: [React Map GL](https://visgl.github.io/react-map-gl/) using [Maplibre](https://maplibre.org/)
- Input validation: [Zod](https://zod.dev/)
- State manager: [Jotai](https://jotai.org/)

## Portal Features

#### Map Page

- Filter, display and download various types of data
- Download a picture of the map with different layers
- Customise the colours of the features on the map
- Choose from a variety of basemaps
- View feature data on hover
- Download cluster data

#### Database Page

- List sources of all the different types of data

#### Publications Page

- Search from a list of publications within the database

#### Login System

- Logging in will allow the user to view data from restricted sources

#### Admin Dashboard

- Set roles, passwords, change names for existing users
- Add new users
- Search for users

## Updating the Portal

Adding new filter types: Refer to comments in `@/lib/filters.ts`

Adding new data types/filters for existing data: Refer to comments in `@/lib/data-definitions.ts`

Updating the database: The database isn't directly managed by Drizzle, so we pull the database config from Postgres:

1. Set `DATABASE_URL` env variable to port `5432` (The following command won't work otherwise)
2. Run `npx drizzle-kit pull` command
3. Update `@/server/db/schema.ts` with the changes. Note that you may have to edit some of the generated code if the data types are unsupported
4. Set `DATABASE_URL` env variable back to port `6543`
