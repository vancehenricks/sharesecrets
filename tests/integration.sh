#!/bin/bash

# Integration Tests for OneTimeShare API
# Tests all endpoints using curl and validates responses

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TIMEOUT=5

# Helper functions
log_test() {
  echo -e "${BLUE}→${NC} $1"
  ((TESTS_RUN++))
}

log_pass() {
  echo -e "${GREEN}✓${NC} $1"
  ((TESTS_PASSED++))
}

log_fail() {
  echo -e "${RED}✗${NC} $1"
  ((TESTS_FAILED++))
}

log_section() {
  echo ""
  echo -e "${YELLOW}## $1${NC}"
}

# Check server connectivity
check_server() {
  log_section "Server Connectivity"
  log_test "Checking if server is running on $API_URL"
  
  if timeout $TIMEOUT curl -s "$API_URL" > /dev/null 2>&1; then
    log_pass "Server is reachable"
  else
    log_fail "Cannot reach server at $API_URL"
    echo "Start server with: npm run build && node dist/server.js"
    exit 1
  fi
}

# Test: Create secret with valid encrypted content
test_create_secret() {
  log_section "POST /api/secrets - Create Secret"
  
  log_test "Creating secret with encrypted content"
  RESPONSE=$(curl -s -X POST "$API_URL/api/secrets" \
    -H "Content-Type: application/json" \
    -d '{"encryptedContent":"ZCg/wm9sWWGXW8oc1Nb8fXdT9J21nw6ciCKMueNNzzzGi88DtV=="}')
  
  # Check if response contains required fields
  if echo "$RESPONSE" | grep -q '"id"'; then
    log_pass "Response contains id"
  else
    log_fail "Response missing id: $RESPONSE"
    return
  fi
  
  if echo "$RESPONSE" | grep -q '"shareUrl"'; then
    log_pass "Response contains shareUrl"
  else
    log_fail "Response missing shareUrl"
    return
  fi
  
  if echo "$RESPONSE" | grep -q '"expiresAt"'; then
    log_pass "Response contains expiresAt"
  else
    log_fail "Response missing expiresAt"
    return
  fi
  
  # Extract ID for later tests
  CREATED_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
  log_pass "Extracted secret ID: $CREATED_ID"
}

# Test: Create secret without encrypted content (should fail)
test_create_secret_missing_content() {
  log_section "POST /api/secrets - Error Cases"
  
  log_test "Creating secret without encryptedContent (should fail)"
  RESPONSE=$(curl -s -X POST "$API_URL/api/secrets" \
    -H "Content-Type: application/json" \
    -d '{}')
  
  if echo "$RESPONSE" | grep -q '"error"'; then
    log_pass "Correctly returned error response"
  else
    log_fail "Expected error response: $RESPONSE"
  fi
}

# Test: Create secret with empty encrypted content
test_create_secret_empty_content() {
  log_test "Creating secret with empty encryptedContent (should fail)"
  RESPONSE=$(curl -s -X POST "$API_URL/api/secrets" \
    -H "Content-Type: application/json" \
    -d '{"encryptedContent":""}')
  
  if echo "$RESPONSE" | grep -q '"error"'; then
    log_pass "Correctly rejected empty content"
  else
    log_fail "Should reject empty content: $RESPONSE"
  fi
}

# Test: Retrieve secret
test_retrieve_secret() {
  log_section "GET /api/secrets/:id - Retrieve Secret"
  
  if [ -z "$CREATED_ID" ]; then
    log_fail "No secret ID available (create secret first)"
    return
  fi
  
  log_test "Retrieving secret with ID: $CREATED_ID"
  RESPONSE=$(curl -s "$API_URL/api/secrets/$CREATED_ID")
  
  if echo "$RESPONSE" | grep -q '"encryptedContent"'; then
    log_pass "Response contains encrypted content"
  else
    log_fail "Response missing encryptedContent: $RESPONSE"
    return
  fi
  
  ENCRYPTED=$(echo "$RESPONSE" | grep -o '"encryptedContent":"[^"]*' | cut -d'"' -f4)
  log_pass "Retrieved encrypted content: ${ENCRYPTED:0:50}..."
}

# Test: One-time access (should fail on second retrieval)
test_one_time_access() {
  log_section "One-Time Access Enforcement"
  
  log_test "Creating new secret for one-time access test"
  RESPONSE=$(curl -s -X POST "$API_URL/api/secrets" \
    -H "Content-Type: application/json" \
    -d '{"encryptedContent":"test-one-time-access"}')
  
  ONE_TIME_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
  
  if [ -z "$ONE_TIME_ID" ]; then
    log_fail "Could not create secret for one-time test"
    return
  fi
  
  log_test "Retrieving secret first time"
  FIRST_RETRIEVAL=$(curl -s "$API_URL/api/secrets/$ONE_TIME_ID")
  
  if echo "$FIRST_RETRIEVAL" | grep -q '"encryptedContent"'; then
    log_pass "First retrieval successful"
  else
    log_fail "First retrieval failed: $FIRST_RETRIEVAL"
    return
  fi
  
  log_test "Attempting second retrieval (should fail)"
  SECOND_RETRIEVAL=$(curl -s "$API_URL/api/secrets/$ONE_TIME_ID")
  
  if echo "$SECOND_RETRIEVAL" | grep -q '"error"'; then
    log_pass "Second retrieval correctly rejected (one-time access enforced)"
  else
    log_fail "Second retrieval should fail: $SECOND_RETRIEVAL"
  fi
}

# Test: Retrieve non-existent secret
test_retrieve_nonexistent() {
  log_section "GET /api/secrets/:id - Error Cases"
  
  log_test "Retrieving non-existent secret"
  RESPONSE=$(curl -s "$API_URL/api/secrets/nonexistent-id-123456789012345")
  
  if echo "$RESPONSE" | grep -q '"error"'; then
    log_pass "Correctly returned error for non-existent secret"
  else
    log_fail "Should return error for non-existent secret: $RESPONSE"
  fi
}

# Test: Check secret validity
test_check_secret() {
  log_section "GET /api/secrets/:id/check - Check Validity"
  
  log_test "Creating secret for validity check"
  RESPONSE=$(curl -s -X POST "$API_URL/api/secrets" \
    -H "Content-Type: application/json" \
    -d '{"encryptedContent":"test-validity"}')
  
  CHECK_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
  
  if [ -z "$CHECK_ID" ]; then
    log_fail "Could not create secret for check test"
    return
  fi
  
  log_test "Checking if secret is valid"
  CHECK_RESPONSE=$(curl -s "$API_URL/api/secrets/$CHECK_ID/check")
  
  if echo "$CHECK_RESPONSE" | grep -q '"valid":true'; then
    log_pass "Secret correctly marked as valid"
  else
    log_fail "Expected valid=true: $CHECK_RESPONSE"
    return
  fi
  
  log_test "Retrieving secret"
  curl -s "$API_URL/api/secrets/$CHECK_ID" > /dev/null
  
  log_test "Checking validity after retrieval (should be invalid)"
  CHECK_RESPONSE=$(curl -s "$API_URL/api/secrets/$CHECK_ID/check")
  
  if echo "$CHECK_RESPONSE" | grep -q '"valid":false'; then
    log_pass "Secret correctly marked as invalid after retrieval"
  else
    log_fail "Expected valid=false after retrieval: $CHECK_RESPONSE"
  fi
}

# Test: Multiple secrets independently
test_multiple_secrets() {
  log_section "Multiple Secrets"
  
  log_test "Creating first secret"
  RESPONSE1=$(curl -s -X POST "$API_URL/api/secrets" \
    -H "Content-Type: application/json" \
    -d '{"encryptedContent":"secret-one"}')
  
  ID1=$(echo "$RESPONSE1" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
  
  log_test "Creating second secret"
  RESPONSE2=$(curl -s -X POST "$API_URL/api/secrets" \
    -H "Content-Type: application/json" \
    -d '{"encryptedContent":"secret-two"}')
  
  ID2=$(echo "$RESPONSE2" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
  
  if [ "$ID1" != "$ID2" ]; then
    log_pass "Different secrets have different IDs"
  else
    log_fail "Secrets should have unique IDs"
    return
  fi
  
  log_test "Retrieving first secret"
  RETRIEVE1=$(curl -s "$API_URL/api/secrets/$ID1")
  
  if echo "$RETRIEVE1" | grep -q 'secret-one'; then
    log_pass "First secret retrieved correctly"
  else
    log_fail "First secret retrieval failed: $RETRIEVE1"
  fi
  
  log_test "Retrieving second secret"
  RETRIEVE2=$(curl -s "$API_URL/api/secrets/$ID2")
  
  if echo "$RETRIEVE2" | grep -q 'secret-two'; then
    log_pass "Second secret retrieved correctly"
  else
    log_fail "Second secret retrieval failed: $RETRIEVE2"
  fi
}

# Test: HTTP status codes
test_status_codes() {
  log_section "HTTP Status Codes"
  
  log_test "Creating secret (should return 200)"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/secrets" \
    -H "Content-Type: application/json" \
    -d '{"encryptedContent":"test-status"}')
  
  if [ "$STATUS" = "200" ]; then
    log_pass "Create secret returns 200"
  else
    log_fail "Create secret returned $STATUS instead of 200"
  fi
  
  log_test "Retrieving non-existent secret (should return 404)"
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/secrets/invalid-id-9999999999999")
  
  if [ "$STATUS" = "404" ]; then
    log_pass "Non-existent secret returns 404"
  else
    log_fail "Non-existent secret returned $STATUS instead of 404"
  fi
}

# Test: Share URL format
test_share_url_format() {
  log_section "Share URL Format"
  
  log_test "Creating secret"
  RESPONSE=$(curl -s -X POST "$API_URL/api/secrets" \
    -H "Content-Type: application/json" \
    -d '{"encryptedContent":"test-url-format"}')
  
  SHARE_URL=$(echo "$RESPONSE" | grep -o '"shareUrl":"[^"]*' | cut -d'"' -f4)
  
  if echo "$SHARE_URL" | grep -q "/share/"; then
    log_pass "Share URL contains /share/ path"
  else
    log_fail "Share URL format incorrect: $SHARE_URL"
    return
  fi
  
  if echo "$SHARE_URL" | grep -q "http"; then
    log_pass "Share URL is absolute (includes protocol)"
  else
    log_fail "Share URL should be absolute: $SHARE_URL"
  fi
}

# Test: Response JSON validity
test_json_validity() {
  log_section "JSON Response Validity"
  
  log_test "Creating secret"
  RESPONSE=$(curl -s -X POST "$API_URL/api/secrets" \
    -H "Content-Type: application/json" \
    -d '{"encryptedContent":"test-json"}')
  
  if echo "$RESPONSE" | grep -q '{'; then
    log_pass "Response is JSON"
  else
    log_fail "Response is not valid JSON: $RESPONSE"
    return
  fi
  
  ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4 | head -1)
  
  log_test "Retrieving secret"
  RETRIEVE=$(curl -s "$API_URL/api/secrets/$ID")
  
  if echo "$RETRIEVE" | grep -q '{'; then
    log_pass "Retrieved response is JSON"
  else
    log_fail "Retrieved response is not valid JSON: $RETRIEVE"
  fi
}

# Main test execution
main() {
  echo -e "${BLUE}"
  echo "╔════════════════════════════════════════╗"
  echo "║  OneTimeShare API Integration Tests   ║"
  echo "╚════════════════════════════════════════╝"
  echo -e "${NC}"
  
  check_server
  test_create_secret
  test_create_secret_missing_content
  test_create_secret_empty_content
  test_retrieve_secret
  test_one_time_access
  test_retrieve_nonexistent
  test_check_secret
  test_multiple_secrets
  test_status_codes
  test_share_url_format
  test_json_validity
  
  # Print summary
  log_section "Test Summary"
  echo "Total tests: $TESTS_RUN"
  echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
  if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
  else
    echo -e "${GREEN}Failed: $TESTS_FAILED${NC}"
  fi
  
  if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
  else
    echo ""
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
  fi
}

# Run main
main "$@"
