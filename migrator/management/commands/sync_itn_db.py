import os
import tempfile
import pymysql
from sshtunnel import SSHTunnelForwarder
from django.core.management.base import BaseCommand
from django.conf import settings
import stat


class Command(BaseCommand):
    help = 'Fetch the latest text for each aid from the articletext table'

    def handle(self, *args, **kwargs):
        ssh_host = settings.ITN_DB_MACHINE_SSH_ADDR
        ssh_user = settings.ITN_DB_MACHINE_SSH_USER
        ssh_key = settings.ITN_DB_MACHINE_SSH_KEY
        db_user = settings.ITN_DB_USER
        db_password = settings.ITN_DB_PASSWORD
        db_name = 'fulltext'

        with tempfile.NamedTemporaryFile(delete=False) as tmp_ssh_key:
            tmp_ssh_key.write(ssh_key.replace('\\n', '\n').encode())
            tmp_ssh_key.flush()
            os.fchmod(tmp_ssh_key.fileno(), stat.S_IRUSR | stat.S_IWUSR)
            ssh_key_path = tmp_ssh_key.name

            print(ssh_key_path)
            with SSHTunnelForwarder(
                (ssh_host, 22),
                ssh_username=ssh_user,
                ssh_pkey=ssh_key_path,
                remote_bind_address=('127.0.0.1', 3306)
            ) as tunnel:
                connection = pymysql.connect(
                    host='127.0.0.1',
                    user=db_user,
                    password=db_password,
                    database=db_name,
                    port=tunnel.local_bind_port
                )

                try:
                    with connection.cursor() as cursor:
                        query = '''
                            SELECT aid, text
                            FROM articletext t1
                            WHERE timestamp = (
                                SELECT MAX(timestamp)
                                FROM articletext t2
                                WHERE t1.aid = t2.aid
                            )
                        '''
                        cursor.execute(query)
                        results = cursor.fetchall()
                        
                        articles = {row[0]: {'text': row[1]} for row in results}
                        
                        print(articles)

                finally:
                    connection.close()
