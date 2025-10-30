from datetime import datetime, timedelta

class DateUtils:
    @staticmethod
    def parse_date(date_str: str) -> datetime:
        """
        Converte uma string no formato 'yyyy-MM-dd' para um objeto datetime.
        """
        return datetime.strptime(date_str, '%Y-%m-%d')

    @staticmethod
    def get_start_of_month(date: datetime) -> datetime:
        """
        Retorna o primeiro dia do mês da data fornecida com o horário ajustado para 00:00:00.
        """
        return date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    @staticmethod
    def get_end_of_month(date: datetime) -> datetime:
        """
        Retorna o último dia do mês da data fornecida com o horário ajustado para 23:59:59.999.
        """
        start_of_next_month = DateUtils.get_start_of_month(date + timedelta(days=31))
        return start_of_next_month - timedelta(milliseconds=1)
