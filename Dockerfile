FROM node:18-alpine

WORKDIR /app

# Copy the TUI project
COPY f1-ink/ ./

# Install dependencies and build
RUN npm install
RUN npm run build

# Link the package globally so 'f1-terminal-cli' is available in the container's PATH
RUN npm link

# The default command runs the TUI
ENTRYPOINT ["f1-terminal-cli"]
