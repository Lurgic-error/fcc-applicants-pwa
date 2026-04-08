FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_APPLICANT_API_BASE_URL=http://localhost:5050/api/v1
ARG VITE_APPLICANT_USE_MOCKS=false
ENV VITE_APPLICANT_API_BASE_URL=${VITE_APPLICANT_API_BASE_URL}
ENV VITE_APPLICANT_USE_MOCKS=${VITE_APPLICANT_USE_MOCKS}
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
