# Build stage
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build skip tests for faster deployment
RUN mvn clean package -DskipTests

# Run stage
# Using Java 21 as it is the current standard LTS for production. 
# If you strictly need Java 25, we would use a different base image.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Cloudinary and DB environment variables will be injected at runtime by Render
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
