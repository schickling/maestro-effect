#!/usr/bin/env bash
set -euo pipefail

# Configuration
SIMULATOR_NAME="MaestroEffectCI_$(date +%s)"
SIMULATOR_ID=""
EXPO_PID=""
MAESTRO_EFFECT_PID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Cleanup function
cleanup() {
    local exit_code=$?
    echo -e "${YELLOW}Cleaning up...${NC}"
    
    # Kill processes
    [[ -n "${EXPO_PID:-}" ]] && kill "$EXPO_PID" 2>/dev/null || true
    [[ -n "${MAESTRO_EFFECT_PID:-}" ]] && kill "$MAESTRO_EFFECT_PID" 2>/dev/null || true
    
    # Delete simulator
    if [[ -n "${SIMULATOR_ID:-}" ]]; then
        xcrun simctl shutdown "$SIMULATOR_ID" 2>/dev/null || true
        xcrun simctl delete "$SIMULATOR_ID" 2>/dev/null || true
    fi
    
    # Kill Simulator app
    killall Simulator 2>/dev/null || true
    
    exit $exit_code
}
trap cleanup EXIT INT TERM

# Log function
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

# Error function
error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1" >&2
}

# Wait for app to be ready with intelligent detection
wait_for_app_ready() {
    local max_wait=30
    local count=0
    
    log "Waiting for app to initialize..."
    
    while [[ $count -lt $max_wait ]]; do
        local ready_indicators=0
        
        # Check for app title
        if maestro --udid "$SIMULATOR_ID" query text="Maestro Effect Demo" > /dev/null 2>&1; then
            ((ready_indicators++))
            log "✓ App title visible"
        fi
        
        # Check for login button
        if maestro --udid "$SIMULATOR_ID" query id="login-button" > /dev/null 2>&1; then
            ((ready_indicators++))
            log "✓ Login button ready"
        fi
        
        # Check logs for initialization
        if [[ -f expo.log ]] && grep -q "INITIALIZATION_COMPLETE" expo.log 2>/dev/null; then
            ((ready_indicators++))
            log "✓ App initialization complete"
        fi
        
        # Check Expo bundler ready
        if [[ -f expo.log ]] && grep -q "Logs for your project will appear below" expo.log 2>/dev/null; then
            ((ready_indicators++))
            log "✓ Expo bundler ready"
        fi
        
        # Proceed if 3+ indicators are ready
        if [[ $ready_indicators -ge 3 ]]; then
            log "✅ App is ready (${count}s)"
            return 0
        fi
        
        sleep 2
        ((count += 2))
        
        # Show progress
        if [[ $((count % 6)) -eq 0 ]]; then
            log "Still waiting... (${count}s, indicators: ${ready_indicators}/4)"
        fi
    done
    
    error "⚠️ Timeout waiting for app, proceeding anyway"
    return 1
}

# Main execution
main() {
    log "🎯 Starting Maestro Effect CI Test"
    
    # 1. Create and boot simulator
    log "Creating iOS simulator..."
    local ios_runtime=$(xcrun simctl list runtimes | grep "iOS" | head -1 | grep -o "com\.apple\.CoreSimulator\.SimRuntime\.iOS-[0-9-]*" || true)
    
    if [[ -z "$ios_runtime" ]]; then
        error "No iOS runtime found"
        exit 1
    fi
    
    SIMULATOR_ID=$(xcrun simctl create "$SIMULATOR_NAME" "iPhone 15" "$ios_runtime")
    log "Created simulator: $SIMULATOR_ID"
    
    xcrun simctl boot "$SIMULATOR_ID"
    log "Booted simulator"
    
    # Open Simulator app
    open -a Simulator --args -CurrentDeviceUDID "$SIMULATOR_ID"
    sleep 3
    
    # 2. Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        log "Installing dependencies..."
        pnpm install
    fi
    
    # 3. Start Expo server
    log "Starting Expo server..."
    CI=1 EXPO_PUBLIC_API_URL=http://localhost:8082 bun expo start --port 8082 --clear > expo.log 2>&1 &
    EXPO_PID=$!
    
    # 4. Wait for Expo server
    log "Waiting for Expo server..."
    local server_wait=0
    while ! curl -s "http://localhost:8082" > /dev/null; do
        sleep 1
        ((server_wait++))
        if [[ $server_wait -gt 30 ]]; then
            error "Expo server failed to start"
            cat expo.log || true
            exit 1
        fi
    done
    log "Expo server is running"
    
    # 5. Open app in simulator
    log "Loading app in simulator..."
    xcrun simctl openurl "$SIMULATOR_ID" "exp://127.0.0.1:8082"
    
    # 6. Wait for app to be ready
    wait_for_app_ready
    
    # 7. Run Maestro YAML test
    log "Running Maestro YAML test..."
    if maestro --udid "$SIMULATOR_ID" test maestro/login-test.yaml; then
        log "✅ Maestro YAML test passed"
    else
        error "Maestro YAML test failed"
        # Capture debug info
        maestro --udid "$SIMULATOR_ID" query || true
        tail -20 expo.log || true
        exit 1
    fi
    
    # 8. Run Effect-based test
    log "Running Effect-based test..."
    if MAESTRO_DEVICE_ID="$SIMULATOR_ID" bun run test-effect.ts; then
        log "✅ Effect test passed"
    else
        error "Effect test failed"
        exit 1
    fi
    
    log "✨ All tests passed successfully!"
}

# Run main function
main "$@"