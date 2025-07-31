FROM forallsecure/mapi:latest 

COPY container_src/* /
EXPOSE 8080

# Run
# ENTRYPOINT ["/mapi", "run"]