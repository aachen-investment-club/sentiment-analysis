
from fpdf import FPDF
from typing import List, Tuple, Dict
import io


class TemplateAIC(FPDF):

    def header(self):
        # ---- Colors ----
        self.set_draw_color(10, 44, 95)  # dark blue
        self.set_line_width(2)

        # ---- Page border ----
        margin = 10
        self.rect(
            margin,
            margin,
            self.w - 2 * margin,
            self.h - 2 * margin
        )

        # ---- Logo ----
        self.image("./static/aic_logo.png", x=(self.w - 60) / 2, y=15, w=60)

        # ---- Move cursor below logo ----
        self.ln(35)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", size=8)
        self.cell(0, 10, str(self.page_no()), align="R")



class PlotExport:
    """
    This class parametrizes the export function of a plot.  
    """


    def __init__(
            self,
            title, 
            figure_bytes, 
            metrics: List,
            interpretation): 
        self.title = title 
        self.fig = figure_bytes
        self.metrics = metrics
        self.interpretation = interpretation


    def draw(self, pdf, safe_x, safe_width, img_width): 

        pdf.set_font("Arial", size=14)
        pdf.set_x(safe_x)

        pdf.multi_cell(safe_width, 7, self.title)
        pdf.ln(4)

        if self.fig.data:
            img_bytes = self.fig.to_image(format="png", scale=2)
            img_stream = io.BytesIO(img_bytes)
            img_x = safe_x + (safe_width - img_width) / 2

            pdf.image(img_stream, x=img_x, w=img_width)
            pdf.ln(4)
        
        if len(self.metrics)!= 0: 
            self.draw_metrics_row(pdf,  safe_x, safe_width)


        pdf.set_font("Arial", size=11)
        pdf.set_x(safe_x)

        pdf.multi_cell(safe_width, 7, self.interpretation)
        pdf.ln(10)


    def draw_metrics_row(self, pdf,   safe_x, safe_width):
       
        metrics = self.metrics
        col_count = len(metrics)
        col_width = safe_width / col_count

        start_y = pdf.get_y()

        # Labels
        pdf.set_font("Arial", size=9)
        for i, (label, _) in enumerate(metrics):
            x = safe_x + i * col_width
            pdf.set_xy(x, start_y)
            pdf.cell(col_width, 6, label, align="C")

        # Values
        pdf.set_font("Arial", "B", 11)
        for i, (_, value) in enumerate(metrics):
            x = safe_x + i * col_width
            pdf.set_xy(x, start_y + 6)
            pdf.cell(col_width, 8, value, align="C")

        # Move cursor below the metrics row
        pdf.set_y(start_y + 16)