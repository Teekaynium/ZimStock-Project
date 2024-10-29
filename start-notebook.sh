#!/bin/bash

# Start the Jupyter notebook server
echo "Starting Jupyter Notebook..."
jupyter notebook --ip=0.0.0.0 --no-browser --allow-root &

# Wait for the server to start
sleep 5

# Print the URL to access the notebook
echo "Jupyter Notebook is running. Access it at:"
jupyter notebook list