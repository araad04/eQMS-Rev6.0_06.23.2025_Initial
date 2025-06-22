#!/bin/bash

# IEC 62304 Compliant Test Schedule Setup
# Document ID: TEST-CRON-001
# Version: 1.0.0
# Last Updated: 2025-05-15

# This script sets up automated testing on a 15-minute schedule
# as required by IEC 62304 validation processes.

# Make test script executable
chmod +x ./run-tests.sh

# Set up the cron job to run tests every 15 minutes
(crontab -l 2>/dev/null; echo "*/15 * * * * cd $(pwd) && ./run-tests.sh >> $(pwd)/cron.log 2>&1") | crontab -

echo "IEC 62304 compliant test schedule has been set up successfully."
echo "Tests will run automatically every 15 minutes."
echo "Test logs will be stored in the ./test-logs directory."
echo "Test reports will be generated in the ./test-reports directory."
echo "Cron job execution logs will be stored in $(pwd)/cron.log"