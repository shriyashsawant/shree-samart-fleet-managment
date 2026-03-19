FROM eclipse-temurin:17-jdk-alpine
WORKDIR /app

# Copy all backend files including Maven wrapper
COPY mvnw .
COPY mvnw.cmd .
COPY pom.xml .
COPY .mvn .mvn
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Expose and run
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "target/enterprise-1.0.0.jar"]
