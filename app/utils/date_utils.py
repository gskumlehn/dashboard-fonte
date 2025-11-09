from datetime import datetime, timedelta, timezone, date

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

    @staticmethod
    def create_brazilian_date_without_altering(input_date) -> datetime:
        """
        Cria uma data com timezone brasileiro (UTC-3) sem alterar o dia, mês ou ano.
        Aceita:
        - Strings no formato 'yyyy-MM-dd' (data completa).
        - Strings no formato 'yyyy-MM' (ano e mês, atribuindo o dia 15 às 00:00).
        - Objetos datetime.date.
        """
        brazil_tz = timezone(timedelta(hours=-3))

        if isinstance(input_date, date) and not isinstance(input_date, datetime):
            input_date = input_date.strftime('%Y-%m-%d')

        if isinstance(input_date, str):
            if len(input_date) == 7:  # Format 'yyyy-MM'
                input_date += '-15'  # Assign the 15th day of the month
            utc_date = datetime.strptime(input_date, '%Y-%m-%d').replace(tzinfo=timezone.utc)
        else:
            raise ValueError("Unsupported input type for date conversion.")

        brazil_date = datetime(
            year=utc_date.year,
            month=utc_date.month,
            day=utc_date.day,
            tzinfo=brazil_tz
        )
        return brazil_date
