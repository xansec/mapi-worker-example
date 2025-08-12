# syntax=docker/dockerfile:1

FROM golang:1.24-alpine AS build

# Set destination for COPY
WORKDIR /app

# Download any Go modules
COPY container_src/go.mod ./
RUN go mod download

# Copy container source code
COPY container_src/*.go ./

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o /server

FROM forallsecure/mapi:latest AS prod

# This can be removed in the future when the mapi image is updated
RUN wget https://app.mayhem.security/cli/mapi/linux-musl/latest/mapi && chmod +x ./mapi
RUN install ./mapi /usr/local/bin/ && rm ./mapi

COPY --from=build /server /server

# Run
CMD ["/server"]
ENTRYPOINT []

EXPOSE 8080