FROM mcr.microsoft.com/mssql/server:2022-latest

USER root

WORKDIR /usr/src/app

COPY ./init/init.sql ./init.sql
COPY ./entrypoint.sh ./entrypoint.sh

RUN apt-get update && apt-get install -y dos2unix && \
    dos2unix ./entrypoint.sh && \
    chmod +x ./entrypoint.sh && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 1433

CMD ["./entrypoint.sh"]