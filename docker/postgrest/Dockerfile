FROM postgrest/postgrest:v12.2.3 AS source
FROM alpine:3.19
RUN apk add --no-cache wget
COPY --from=source /bin/postgrest /bin/postgrest
EXPOSE 3000
USER 1000:1000
CMD ["postgrest"]
