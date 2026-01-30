FROM postgrest/postgrest:v12.2.3 AS source
FROM alpine:3.21
RUN apk add --no-cache wget && \
    addgroup -g 1000 postgrest && \
    adduser -u 1000 -G postgrest -D postgrest
COPY --from=source /bin/postgrest /bin/postgrest
EXPOSE 3000
USER postgrest
CMD ["postgrest"]
