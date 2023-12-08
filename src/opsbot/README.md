# Algorea Ops bot

## Run locally

```
sls invoke local --function bot --data '{ "body":"{\"token\":1, \"type\":\"event_callback\", \"event\":{\"type\":\"message\", \"text\":\"status\", \"channel\":\"D068VNQKXDG\"} }" }' --aws-profile algorea
```
