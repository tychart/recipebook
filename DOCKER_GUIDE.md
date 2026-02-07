# Docker Basics Guide

This guide provides an introduction to Docker for you guys who are new to containerization, or just docker in general. It also covers the fundamental concepts you'll need to work with Docker in this project.

ANY TERMINAL COMMANDS SHOWN IN THIS .md FILE ARE USING BASH, NOT POWERSHELL

## Table of Contents
- [What is Docker?](#what-is-docker)
- [Key Concepts](#key-concepts)
- [Docker Images](#docker-images)
- [Docker Containers](#docker-containers)
- [Docker Compose](#docker-compose)
- [Common Commands](#common-commands)
- [Working with This Project](#working-with-this-project) GO HERE IF YOU WANT TO SEE HOW TO GET THE PROJECT WORKING

## What is Docker?

Docker is a platform that allows you to package applications and their dependencies into lightweight, portable containers. Think of containers as standardized boxes that contain everything your application needs to run—code, runtime, system tools, libraries, and settings.

### Why Use Docker?

- **Consistency**: Your application runs the same way on any machine (your laptop, a teammate's computer, or a server)
- **Isolation**: Each container is separate from others, preventing conflicts
- **Portability**: "It works on my machine" becomes "it works everywhere"
- **Simplicity**: Easy to set up complex applications with multiple services

## Key Concepts

### Docker Image

An **image** is a read-only template used to create containers. It's like a blueprint or a snapshot of a filesystem with your application and all its dependencies.

### Docker Container

A **container** is a running instance of an image. It's like a house built from a blueprint—you can build many houses (containers) from the same blueprint (image).

### Dockerfile

A **Dockerfile** is a text file with instructions for building a Docker image. It defines what goes into your image step by step.

### Docker Compose

**Docker Compose** is a tool for defining and running multi-container Docker applications. Instead of running multiple `docker run` commands, you use a single `docker-compose.yml` file to configure and start all your services together.

## Docker Images

### What is a Docker Image?

A Docker image is a packaged application with all its dependencies. Images are built from Dockerfiles and stored in a registry (like Docker Hub) or locally on your machine.

### Building Images

Images are built using a `Dockerfile`. You can find the Dockerfile for this project in /web/Dockerfile. Here's a simple example:

```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

**Common Dockerfile Instructions:**
- `FROM`: Specifies the base image to start from
- `WORKDIR`: Sets the working directory inside the container
- `COPY`: Copies files from your computer into the image
- `RUN`: Executes commands during image build
- `CMD`: Defines the default command to run when the container starts
- `EXPOSE`: Documents which ports the container will use

### Image Commands

```bash
# Build an image from a Dockerfile
docker build -t my-app:latest .

# List all images on your machine
docker images

# Remove an image
docker rmi my-app:latest

# Pull an image from a registry (like Docker Hub)
docker pull python:3.13-slim
```

## Docker Containers

### What is a Docker Container?

A container is a running instance of an image. When you start a container, Docker creates a writable layer on top of the image, allowing the application to run.

### Container Lifecycle

1. **Create**: Define a container from an image
2. **Start**: Begin running the container
3. **Stop**: Halt the running container (data persists)
4. **Remove**: Delete the container (data is lost unless in volumes)

### Container Commands

```bash
# Run a container from an image
docker run -d -p 8000:8000 my-app:latest

# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# Stop a running container
docker stop <container-id>

# Start a stopped container
docker start <container-id>

# Remove a container
docker rm <container-id>

# View container logs
docker logs <container-id>

# Execute a command in a running container
docker exec -it <container-id> /bin/bash
```

### Common Flags

- `-d`: Run in detached mode (background)
- `-p <host>:<container>`: Map ports (e.g., `-p 8000:8000` maps host port 8000 to container port 8000)
- `-it`: Interactive terminal mode
- `--name`: Give the container a name
- `-v`: Mount a volume (persistent storage)

## Docker Compose

### What is Docker Compose?

Docker Compose is a tool for managing multi-container applications. Instead of manually starting multiple containers and linking them together, you define everything in a `docker-compose.yml` file.

### docker-compose.yml Structure

Here's a simplified example that tyler made in the docker-compose.yml file:

```yaml
services: #Uses the dockerfiles in the server and web repo to define which docker containers to run
  recipiebook-server:
    build:
      context: ./server
    ports:
      - "8000:8000" #builds the ./server repo on port 8000 locally

  recipiebook-web:
    build:
      context: ./web
    depends_on:
      - recipiebook-server
    ports:
      - "8650:80" #builds the /.web repo on port 8650 locally
```

**Key Elements:**
- `services`: Defines the containers to run
- `build`: Specifies how to build the image (using a Dockerfile in the context directory)
- `ports`: Maps ports from container to host
- `depends_on`: Ensures services start in the correct order
- `environment`: Sets environment variables
- `volumes`: Mounts directories for persistent data

### Docker Compose Commands

```bash
# Build and start all services
docker compose up --build

# Start services in the background
docker compose up -d

# Stop all services
docker compose down

# View logs from all services
docker compose logs

# View logs from a specific service like the recipebook respository
docker compose logs recipiebook-server

# Stop services without removing containers
docker compose stop

# Start stopped services
docker compose start
```

### Benefits of Docker Compose

- **Single Command**: Start your entire application stack with one command
- **Service Dependencies**: Automatically handles startup order
- **Network Isolation**: Services can communicate using service names
- **Configuration as Code**: Everything is defined in version-controlled files

## Common Commands

### Getting Started

```bash
# Check Docker version
docker --version
docker compose version

# Verify Docker software is running
# YOU NEED TO HAVE THE DOCKER SOFTWARE ACTUALLY RUNNING ON YOUR ENVIRONMENT FOR THIS TO WORK
docker ps

```

### Image Management

```bash
# Build an image
docker build -t image-name:tag .

# List images
docker images

# Remove an image
docker rmi image-name:tag

# Remove unused images
docker image prune
```

### Container Management

```bash
# Run a container
docker run -d -p 8000:8000 --name my-container image-name

# List containers
docker ps              # Running containers
docker ps -a           # All containers

# Stop/Start containers
docker stop <container-id>
docker start <container-id>

# Remove containers
docker rm <container-id>
docker container prune  # Remove all stopped containers
```

### Docker Compose

```bash
# Start services
docker compose up
docker compose up -d          # Detached mode
docker compose up --build     # Rebuild images first

# Stop services
docker compose down           # Stop and remove containers
docker compose stop           # Stop without removing

# View logs
docker compose logs
docker compose logs -f        # Follow logs
docker compose logs service-name

# Rebuild specific service
docker compose build service-name
```

### Troubleshooting

```bash
# View container logs
docker logs <container-id>
docker compose logs service-name

# Inspect a container
docker inspect <container-id>

# Execute commands in a container
docker exec -it <container-id> /bin/bash
docker compose exec service-name /bin/bash

# Check resource usage
docker stats
```

## Working with This Project

### Prerequisites

1. **Install Docker Desktop**
   - Download from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
   - Install and start Docker Desktop
   - Verify it's running: `docker ps` should work without errors

2. **Verify Installation**
   ```bash
   docker --version
   docker compose version
   ```

### Running the RecipeBook Application

1. **Navigate to the project directory**
   ```bash
   cd recipebook
   ```

2. **Start all services**
   ```bash
   docker compose up --build
   ```
   The `--build` flag ensures images are rebuilt if Dockerfiles have changed.

   If you would like the container to be deleted immediately after stopping the container, use the following:

   ```bash
   # For individual containers, use the --rm flag
   docker run --rm -d -p 8000:8000 my-app:latest
   
   # For Docker Compose, containers are automatically removed when you run:
   docker compose down
   ```
   
   Note: The `--rm` flag automatically removes the container when it stops. With Docker Compose, `docker compose down` removes containers by default (use `docker compose stop` if you want to keep them).


3. **Access the application**
   - Web interface: [http://localhost:8650](http://localhost:8650)
   - API server: [http://localhost:8000](http://localhost:8000)

4. **Stop the application**
   - Press `Ctrl+C` if running in foreground
   - Or run `docker compose down` in another terminal


### Common Workflows

**Starting fresh:**
```bash
docker compose down
docker compose up --build
```

**Viewing logs:**
```bash
docker compose logs -f
```

**Rebuilding after code changes:**
```bash
docker compose up --build
```

**Cleaning up:**
```bash
docker compose down
docker system prune -a  # Remove all unused images, containers, networks
```

## Troubleshooting Tips

### Docker Desktop Not Running
If you see errors like `The system cannot find the file specified` or `Cannot connect to the Docker daemon`:
- Make sure Docker Desktop is running
- Check the system tray (arrow bottom right of screen pointing up) for Docker Desktop icon

<img src="images/docker-tray-icon.png" alt="Docker Desktop system tray icon" />

- Wait for Docker Desktop to fully start before running commands

### Port Already in Use
If you see `port is already allocated`:
- Stop the service using that port
- Or change the port mapping in `docker-compose.yml`

### Build Failures
- Check that all required files exist (Dockerfile, requirements.txt, etc.)
- Review error messages in the build output
- Ensure Docker Desktop has enough resources allocated

### Container Won't Start
- Check logs: `docker compose logs service-name`
- Verify environment variables are set correctly
- Ensure dependencies are properly defined

## Additional Resources

- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Dockerfile Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

## Quick Reference

| Task | Command |
|------|---------|
| Start application | `docker compose up --build` |
| Stop application | `docker compose down` |
| View logs | `docker compose logs -f` |
| Rebuild service | `docker compose build service-name` |
| List containers | `docker ps` |
| List images | `docker images` |
| Remove everything | `docker compose down && docker system prune -a` |

---

## If you are looking for more detailed documentation on Docker, you can always just use AI or go to the docker website. 
