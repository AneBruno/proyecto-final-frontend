import { E } from '@angular/cdk/keycodes';
import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/auth/shared/services/user.service';
import { ListadoDataSource            } from 'src/app/shared/listado.datasource';
import { ListadoComponent } from 'src/app/shared/listados/listado.component';
import { User } from 'src/app/shared/models/user.model';
import { ApiService } from 'src/app/shared/services/api.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-indicador-clientes',
  templateUrl: './indicador-clientes.component.html',
  styleUrls: ['./indicador-clientes.component.scss']
})
export class IndicadorClientesComponent extends ListadoComponent implements OnInit {

  public currentUser?         : User;
  public chartOptions         : any;
  public chartOptions2        : any;
  public chartOptions3         : any;
  public productos            : Array<any> = [];
  public puertos              : Array<any> = [];
  public formas_pago          : Array<any> = [];
  public cosechas             : Array<any> = [];
  public posiciones           : Array<any> = [];
  public cantTotal            : number = 0;
  public data_negocios        : { x: Date, y: number, z: string }[] = [];
  public data_sin_cerrar      : { x: Date, y: number, z: string }[] = [];
  public data_eliminada       : { x: Date, y: number, z: string }[] = [];

  //Filtros
  public filtroPeriodo?       : string= '%Y-%m';
  public filtroProducto       : string | null =  '';
  public filtroPuerto         : string | null  = '';
  public filtroFormaPago      : string | null  = '';
  public filtroCosecha        : string | null  = '';

  constructor(
    public  dataSource         : ListadoDataSource<any>,
    private apiService         : ApiService,
    private userService        : UserService,
  ) { 
    super();
  }

  ngOnInit(): void {
    this.dataSource.uri = '/indicadores/mercado/clientes';
    this.dataSource.afterFetch.subscribe((data) => {
      this.data_negocios.length=0;
      this.data_sin_cerrar.length=0;
      this.data_eliminada.length=0;
      console.log('afterFetch this.dataSource.currentData', this.dataSource.currentData);
      if(this.filtroPeriodo ==='%Y-%m-%d'){
        this.dataSource.currentData.forEach((elemento)=>{
          const periodo = elemento.periodo;
          const [anioStr, mesStr, diaStr] = periodo.split('-');
          const anio = parseInt(anioStr, 10);
          const mes = parseInt(mesStr, 10);
          const dia = parseInt(diaStr, 10);
          const fecha = new Date(anio, mes - 1, dia);
          this.data_negocios.push({ x: fecha, y: +elemento.Cerrada, z: elemento.razon_social});
          this.data_sin_cerrar.push({ x: fecha, y: +elemento.Activa, z: elemento.razon_social});
          this.data_eliminada.push({ x: fecha, y: +elemento.Eliminada, z: elemento.razon_social});
        })
        this.dibujarGraficoDiario(); 
        this.dibujarGraficoDiarioSinCerrar();
        this.dibujarGraficoDiarioEliminadas();
      }
      if(this.filtroPeriodo ==='%Y-%m'){
        this.dataSource.currentData.forEach((elemento)=>{
          const periodo = elemento.periodo;
          const [anioStr, mesStr] = periodo.split('-');
          const anio = parseInt(anioStr, 10);
          const mes = parseInt(mesStr, 10);
          const fecha = new Date(anio, mes - 1);
          this.data_negocios.push({ x: fecha, y: +elemento.Cerrada, z: elemento.razon_social }); 
          this.data_sin_cerrar.push({ x: fecha, y: +elemento.Activa, z: elemento.razon_social }); 
          this.data_eliminada.push({ x: fecha, y: +elemento.Eliminada, z: elemento.razon_social});
          
        })
        this.dibujarGraficoMensual(); 
        this.dibujarGraficoMensualSinCerrar();
        this.dibujarGraficoMensualEliminadas();
      }
      if(this.filtroPeriodo ==='%Y'){
        this.dataSource.currentData.forEach((elemento)=>{
          const periodo = elemento.periodo;
          this.data_negocios.push({ x: new Date(periodo, 0), y: +elemento.Cerrada, z: elemento.razon_social });  
          this.data_sin_cerrar.push({ x: new Date(periodo, 0), y: +elemento.Activa, z: elemento.razon_social }); 
          this.data_eliminada.push({ x: new Date(periodo, 0), y: +elemento.Eliminada, z: elemento.razon_social }); 
        })
        this.dibujarGraficoAnual(); 
        this.dibujarGraficoAnualSinCerrar();
        this.dibujarGraficoAnualEliminadas();
      } 
    });
    this.currentUser  = this.userService.getUser();
    this.obtenerDatos(); 
    this.setTable();
    this.actualizarDatos();
  }

  public actualizarDatos() {
    this.dataSource.filtros.tipo_periodo = this.filtroPeriodo;
    this.dataSource.filtros.producto_id = this.filtroProducto;
    this.dataSource.filtros.puerto_id = this.filtroPuerto;
    this.dataSource.filtros.condicion_pago_id = this.filtroFormaPago;
    this.dataSource.filtros.cosecha_id = this.filtroCosecha;
    this.dataSource.refreshData();
    if(this.dataSource.currentData.length > 0){
      if(this.filtroPeriodo ==='%Y-%m%-%d' ){
        this.dibujarGraficoDiario(); 
        this.dibujarGraficoDiarioSinCerrar();
        this.dibujarGraficoDiarioEliminadas();
      }
      if(this.filtroPeriodo ==='%Y-%m' ){
        this.dibujarGraficoMensual();
        this.dibujarGraficoMensualSinCerrar();
        this.dibujarGraficoMensualEliminadas();
      }
      if(this.filtroPeriodo ==='%Y' ){
        this.dibujarGraficoAnual();
        this.dibujarGraficoAnualSinCerrar();
        this.dibujarGraficoAnualEliminadas();
      }
    }
  }

  private setTable(): void {
    this.addColumn('periodo',    'Periodo',    '100px');
    this.addColumn('razon_social',    'Razón social',    '100px');
    this.addColumn('Cerrada',    'Negocios cerrados',    '90px');
    this.addColumn('Montos','Monto total', '100px').renderFn(row => 'USD '+row.Monto_USD+'-ARS '+row.Monto_ARS );
    this.addColumn('Activa',    'Sin cerrar',    '100px');
    this.addColumn('Eliminada',    'Eliminadas',    '100px');
    this.addColumn('Total',    'Total de Posiciones',    '100px');
   

  }

  public async obtenerDatos(){
    /*this.empresas     = await this.apiService.getData('/clientes/empresas').toPromise();*/
    this.productos =  await this.apiService.getData('/productos',{
      'ordenes[nombre]': 'asc',
      'limit' : 0,
    }).toPromise();
    this.puertos =  await this.apiService.getData('/puertos',{
      'ordenes[nombre]': 'asc',
      'limit' : 0,
    }).toPromise();
    this.formas_pago =  await this.apiService.getData('/mercado/condiciones-pago',{
      ordenes: {descripcion:'DESC'}
    }).toPromise();
    this.cosechas =   await this.apiService.getAllData('/mercado/cosechas',   
    {ordenes: {descripcion:'DESC'}}).toPromise();
    this.posiciones = await this.apiService.getData('/mercado/posiciones',{}).toPromise();
    console.log("this.posiciones", this.posiciones);
    this.cantTotal = this.posiciones.length;
  }

  public onClearFilters() {
    this.filtroPeriodo       = '%Y-%m';
    this.filtroProducto      = null;
    this.filtroPuerto         = null;
    this.filtroFormaPago      = null;
    this.filtroCosecha        = null;
    this.actualizarDatos();
  }  

  public onFiltroPeriodoChange(event: any): void {
    console.log(event); 
    if (event.target instanceof HTMLSelectElement) {
      const selectedOption = event.target.value;
      this.filtroPeriodo = selectedOption;

    }
  
    this.actualizarDatos();
  }

  public onFiltroProductoChange(event: any): void {
    console.log(event); 
    if (event.target instanceof HTMLSelectElement) {
      const selectedOption = event.target.value;
      this.filtroProducto = selectedOption;
  }
    this.actualizarDatos();
  }

  public onFiltroPuertoChange(event: any): void {
    console.log(event); 
    if (event.target instanceof HTMLSelectElement) {
      const selectedOption = event.target.value;
      this.filtroPuerto = selectedOption;
  }
    this.actualizarDatos();
  }

  public onFiltroFormaPagoChange(event: any): void {
    console.log(event); 
    if (event.target instanceof HTMLSelectElement) {
      const selectedOption = event.target.value;
      this.filtroFormaPago = selectedOption;
  }
    this.actualizarDatos();
  }
  
  public onFiltroCosechaChange(event: any): void {
    console.log(event); 
    if (event.target instanceof HTMLSelectElement) {
      const selectedOption = event.target.value;
      this.filtroCosecha = selectedOption;
  }
    this.actualizarDatos();
  }

  public exportToXLSX(): void {
    // Crear una hoja de cálculo de datos
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSource.currentData);
  
    // Crear un libro de Excel
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compradores'); // nnombre de la hoja
  
    // Guardar el archivo en formato .xlsx
    XLSX.writeFile(wb, 'compradores.xlsx');
  }

  public dibujarGraficoAnual() {
    let chart: any;
    this.chartOptions = {
      animationEnabled: true,
      title: {
        text: "Negocios cerrados por período",
        fontFamily: "Poppins", 
        fontSize: 22,
        fontWeight: 500
      },
      axisX: {
        title: "Períodos",
        valueFormatString: "YYYY",
        intervalType: "year",
        interval: 1
      },
      axisY: {
        title: "Negocios cerrados"
      },
      toolTip: {
        shared: true
      },
      legend: {
        cursor: "pointer",
        itemclick: function (e: any) {
          if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
            e.dataSeries.visible = false;
          } else {
            e.dataSeries.visible = true;
          }
          e.chart.render();
        },
      },
      data: []
    };
  
    // Objeto para almacenar series de datos por razón social
    const seriesPorRazonSocial: Record<string, any> = {};
  
    // Recorre los registros de data_negocios y agrupa por razón social
    for (const registro of this.data_negocios) {
      if (!seriesPorRazonSocial[registro.z]) {
        // Si la serie para la razón social no existe, créala
        seriesPorRazonSocial[registro.z] = {
          type: "line",
          showInLegend: true,
          name: registro.z, // Utiliza el nombre de la empresa como nombre de la serie
          xValueFormatString: "YYYY-MM",
          dataPoints: [], // Inicialmente, un array vacío
        };
      }
  
      // Agrega el punto x e y a la serie correspondiente
      seriesPorRazonSocial[registro.z].dataPoints.push({ x: registro.x, y: registro.y });
    }
  
    // Agrega las series al gráfico
    for (const razonSocial in seriesPorRazonSocial) {
      if (seriesPorRazonSocial.hasOwnProperty(razonSocial)) {
        this.chartOptions.data.push(seriesPorRazonSocial[razonSocial]);
      }
    }
  }

  public dibujarGraficoMensual(){
    let chart: any ;
    this.chartOptions = {
      animationEnabled: true,
      title:{
      text: "Negocios cerrados por período",
      fontFamily: "Poppins", 
      fontSize: 22,
      fontWeight: 500
      },
      axisX:{
      title:"Períodos",
      valueFormatString: "YYYY-MM", 
      intervalType: "month",
      interval : 1  
      },
      axisY: {
      title: "Negocios cerrados"
      },
      toolTip: {
      shared: true
      },
      legend: {
      cursor: "pointer",
      itemclick: function (e: any) {
        if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
          e.dataSeries.visible = false;
        } else {
          e.dataSeries.visible = true;
        } 
        e.chart.render();
      }
      },
      data: []
    };
    // Objeto para almacenar series de datos por razón social
    const seriesPorRazonSocial: Record<string, any> = {};
  
    // Recorre los registros de data_negocios y agrupa por razón social
    for (const registro of this.data_negocios) {
      if (!seriesPorRazonSocial[registro.z]) {
        // Si la serie para la razón social no existe, créala
        seriesPorRazonSocial[registro.z] = {
          type: "line",
          showInLegend: true,
          name: registro.z, // Utiliza el nombre de la empresa como nombre de la serie
          xValueFormatString: "YYYY-MM",
          dataPoints: [], // Inicialmente, un array vacío
        };
      }
  
      // Agrega el punto x e y a la serie correspondiente
      seriesPorRazonSocial[registro.z].dataPoints.push({ x: registro.x, y: registro.y });
    }
  
    // Agrega las series al gráfico
    for (const razonSocial in seriesPorRazonSocial) {
      if (seriesPorRazonSocial.hasOwnProperty(razonSocial)) {
        this.chartOptions.data.push(seriesPorRazonSocial[razonSocial]);
      }
    }
  }

  public dibujarGraficoDiario(){
    let chart: any ;
    this.chartOptions = {
      animationEnabled: true,
      title:{
      text: "Negocios cerrados por período",
      fontFamily: "Poppins", 
      fontSize: 22,
      fontWeight: 500
      },
      axisX:{
      title:"Períodos",
      valueFormatString: "DD/MM", 
      intervalType: "day",
      interval : 1
      },
      axisY: {
      title: "Negocios cerrados"
      },
      toolTip: {
      shared: true
      },
      legend: {
      cursor: "pointer",
      itemclick: function (e: any) {
        if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
          e.dataSeries.visible = false;
        } else {
          e.dataSeries.visible = true;
        } 
        e.chart.render();
      }
      },
      data: []
    };
    // Objeto para almacenar series de datos por razón social
    const seriesPorRazonSocial: Record<string, any> = {};
  
    // Recorre los registros de data_negocios y agrupa por razón social
    for (const registro of this.data_negocios) {
      if (!seriesPorRazonSocial[registro.z]) {
        // Si la serie para la razón social no existe, créala
        seriesPorRazonSocial[registro.z] = {
          type: "line",
          showInLegend: true,
          name: registro.z, // Utiliza el nombre de la empresa como nombre de la serie
          xValueFormatString: "YYYY-MM",
          dataPoints: [], // Inicialmente, un array vacío
        };
      }
  
      // Agrega el punto x e y a la serie correspondiente
      seriesPorRazonSocial[registro.z].dataPoints.push({ x: registro.x, y: registro.y });
    }
  
    // Agrega las series al gráfico
    for (const razonSocial in seriesPorRazonSocial) {
      if (seriesPorRazonSocial.hasOwnProperty(razonSocial)) {
        this.chartOptions.data.push(seriesPorRazonSocial[razonSocial]);
      }
    }
  }

  public dibujarGraficoAnualSinCerrar() {
    let chart: any;
    this.chartOptions2 = {
      animationEnabled: true,
      title: {
        text: "Posiciones de compra sin cerrar por período",
        fontFamily: "Poppins", 
        fontSize: 22,
        fontWeight: 500
      },
      axisX: {
        title: "Períodos",
        valueFormatString: "YYYY",
        intervalType: "year",
        interval: 1
      },
      axisY: {
        title: "Posiciones de compra"
      },
      toolTip: {
        shared: true
      },
      legend: {
        cursor: "pointer",
        itemclick: function (e: any) {
          if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
            e.dataSeries.visible = false;
          } else {
            e.dataSeries.visible = true;
          }
          e.chart.render();
        },
      },
      data: []
    };
  
    // Objeto para almacenar series de datos por razón social
    const seriesPorRazonSocial: Record<string, any> = {};
  
    // Recorre los registros de data_negocios y agrupa por razón social
    for (const registro of this.data_sin_cerrar) {
      if (!seriesPorRazonSocial[registro.z]) {
        // Si la serie para la razón social no existe, créala
        seriesPorRazonSocial[registro.z] = {
          type: "line",
          showInLegend: true,
          name: registro.z, // Utiliza el nombre de la empresa como nombre de la serie
          xValueFormatString: "YYYY",
          dataPoints: [], // Inicialmente, un array vacío
        };
      }
  
      // Agrega el punto x e y a la serie correspondiente
      seriesPorRazonSocial[registro.z].dataPoints.push({ x: registro.x, y: registro.y });
    }
  
    // Agrega las series al gráfico
    for (const razonSocial in seriesPorRazonSocial) {
      if (seriesPorRazonSocial.hasOwnProperty(razonSocial)) {
        this.chartOptions2.data.push(seriesPorRazonSocial[razonSocial]);
      }
    }
  }

  public dibujarGraficoMensualSinCerrar(){
    let chart: any ;
    this.chartOptions2 = {
      animationEnabled: true,
      title:{
      text: "Posiciones de compra sin cerrar por período",
      fontFamily: "Poppins", 
      fontSize: 22,
      fontWeight: 500
      },
      axisX:{
      title:"Períodos",
      valueFormatString: "YYYY-MM", 
      intervalType: "month",
      interval : 1  
      },
      axisY: {
      title: "Posiciones de compra"
      },
      toolTip: {
      shared: true
      },
      legend: {
      cursor: "pointer",
      itemclick: function (e: any) {
        if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
          e.dataSeries.visible = false;
        } else {
          e.dataSeries.visible = true;
        } 
        e.chart.render();
      }
      },
      data: []
    };
    // Objeto para almacenar series de datos por razón social
    const seriesPorRazonSocial: Record<string, any> = {};
  
    // Recorre los registros de data_negocios y agrupa por razón social
    for (const registro of this.data_sin_cerrar) {
      if (!seriesPorRazonSocial[registro.z]) {
        // Si la serie para la razón social no existe, créala
        seriesPorRazonSocial[registro.z] = {
          type: "line",
          showInLegend: true,
          name: registro.z, // Utiliza el nombre de la empresa como nombre de la serie
          xValueFormatString: "YYYY-MM",
          dataPoints: [], // Inicialmente, un array vacío
        };
      }
  
      // Agrega el punto x e y a la serie correspondiente
      seriesPorRazonSocial[registro.z].dataPoints.push({ x: registro.x, y: registro.y });
    }
  
    // Agrega las series al gráfico
    for (const razonSocial in seriesPorRazonSocial) {
      if (seriesPorRazonSocial.hasOwnProperty(razonSocial)) {
        this.chartOptions2.data.push(seriesPorRazonSocial[razonSocial]);
      }
    }
  }

  public dibujarGraficoDiarioSinCerrar(){
    let chart: any ;
    this.chartOptions2 = {
      animationEnabled: true,
      //marginTop: 100,
      title:{
      text: "Posiciones de compra no cerradas por período",
      fontFamily: "Poppins", 
      fontSize: 22,
      fontWeight: 500
      },
      axisX:{
      title:"Períodos",
      valueFormatString: "DD/MM", 
      intervalType: "day",
      interval : 1
      },
      axisY: {
      title: "Posiciones de compra"
      },
      toolTip: {
      shared: true
      },
      legend: {
      cursor: "pointer",
      itemclick: function (e: any) {
        if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
          e.dataSeries.visible = false;
        } else {
          e.dataSeries.visible = true;
        } 
        e.chart.render();
      }
      },
      data: []
    };
    const seriesPorRazonSocial: Record<string, any> = {};
  
    for (const registro of this.data_sin_cerrar) {
      if (!seriesPorRazonSocial[registro.z]) {
        seriesPorRazonSocial[registro.z] = {
          type: "line",
          showInLegend: true,
          name: registro.z, 
          xValueFormatString: "DD/MM",
          dataPoints: [], 
        };
      }
  
      // Agrega el punto x e y a la serie correspondiente
      seriesPorRazonSocial[registro.z].dataPoints.push({ x: registro.x, y: registro.y });
    }
  
    // Agrega las series al gráfico
    for (const razonSocial in seriesPorRazonSocial) {
      if (seriesPorRazonSocial.hasOwnProperty(razonSocial)) {
        this.chartOptions2.data.push(seriesPorRazonSocial[razonSocial]);
      }
    }
  }

  public dibujarGraficoAnualEliminadas() {
    let chart: any;
    this.chartOptions3 = {
      animationEnabled: true,
      title: {
        text: "Posiciones de compra eliminadas por período",
        fontFamily: "Poppins", 
        fontSize: 22,
        fontWeight: 500
      },
      axisX: {
        title: "Períodos",
        valueFormatString: "YYYY",
        intervalType: "year",
        interval: 1
      },
      axisY: {
        title: "Posiciones de compra"
      },
      toolTip: {
        shared: true
      },
      legend: {
        cursor: "pointer",
        itemclick: function (e: any) {
          if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
            e.dataSeries.visible = false;
          } else {
            e.dataSeries.visible = true;
          }
          e.chart.render();
        },
      },
      data: []
    };
  
    // Objeto para almacenar series de datos por razón social
    const seriesPorRazonSocial: Record<string, any> = {};
  
    // Recorre los registros de data_negocios y agrupa por razón social
    for (const registro of this.data_eliminada) {
      if (!seriesPorRazonSocial[registro.z]) {
        // Si la serie para la razón social no existe, créala
        seriesPorRazonSocial[registro.z] = {
          type: "line",
          showInLegend: true,
          name: registro.z, // Utiliza el nombre de la empresa como nombre de la serie
          xValueFormatString: "YYYY",
          dataPoints: [], // Inicialmente, un array vacío
        };
      }
  
      // Agrega el punto x e y a la serie correspondiente
      seriesPorRazonSocial[registro.z].dataPoints.push({ x: registro.x, y: registro.y });
    }
  
    // Agrega las series al gráfico
    for (const razonSocial in seriesPorRazonSocial) {
      if (seriesPorRazonSocial.hasOwnProperty(razonSocial)) {
        this.chartOptions3.data.push(seriesPorRazonSocial[razonSocial]);
      }
    }
  }

  public dibujarGraficoMensualEliminadas(){
    let chart: any ;
    this.chartOptions3 = {
      animationEnabled: true,
      title:{
      text: "Posiciones de compra eliminadas por período",
      fontFamily: "Poppins", 
      fontSize: 22,
      fontWeight: 500
      },
      axisX:{
      title:"Períodos",
      valueFormatString: "YYYY-MM", 
      intervalType: "month",
      interval : 1  
      },
      axisY: {
      title: "Posiciones de compra"
      },
      toolTip: {
      shared: true
      },
      legend: {
      cursor: "pointer",
      itemclick: function (e: any) {
        if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
          e.dataSeries.visible = false;
        } else {
          e.dataSeries.visible = true;
        } 
        e.chart.render();
      }
      },
      data: []
    };
    // Objeto para almacenar series de datos por razón social
    const seriesPorRazonSocial: Record<string, any> = {};
  
    // Recorre los registros de data_negocios y agrupa por razón social
    for (const registro of this.data_eliminada) {
      if (!seriesPorRazonSocial[registro.z]) {
        // Si la serie para la razón social no existe, créala
        seriesPorRazonSocial[registro.z] = {
          type: "line",
          showInLegend: true,
          name: registro.z, // Utiliza el nombre de la empresa como nombre de la serie
          xValueFormatString: "YYYY-MM",
          dataPoints: [], // Inicialmente, un array vacío
        };
      }
  
      // Agrega el punto x e y a la serie correspondiente
      seriesPorRazonSocial[registro.z].dataPoints.push({ x: registro.x, y: registro.y });
    }
  
    // Agrega las series al gráfico
    for (const razonSocial in seriesPorRazonSocial) {
      if (seriesPorRazonSocial.hasOwnProperty(razonSocial)) {
        this.chartOptions3.data.push(seriesPorRazonSocial[razonSocial]);
      }
    }
  }

  public dibujarGraficoDiarioEliminadas(){
    let chart: any ;
    this.chartOptions3 = {
      animationEnabled: true,
      //marginTop: 100,
      title:{
      text: "Posiciones de compra eliminadas por período",
      fontFamily: "Poppins", 
      fontSize: 22,
      fontWeight: 500
      },
      axisX:{
      title:"Períodos",
      valueFormatString: "DD/MM", 
      intervalType: "day",
      interval : 1
      },
      axisY: {
      title: "Posiciones de compra"
      },
      toolTip: {
      shared: true
      },
      legend: {
      cursor: "pointer",
      itemclick: function (e: any) {
        if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
          e.dataSeries.visible = false;
        } else {
          e.dataSeries.visible = true;
        } 
        e.chart.render();
      }
      },
      data: []
    };
    const seriesPorRazonSocial: Record<string, any> = {};
  
    for (const registro of this.data_eliminada) {
      if (!seriesPorRazonSocial[registro.z]) {
        seriesPorRazonSocial[registro.z] = {
          type: "line",
          showInLegend: true,
          name: registro.z, 
          xValueFormatString: "DD/MM",
          dataPoints: [], 
        };
      }
  
      // Agrega el punto x e y a la serie correspondiente
      seriesPorRazonSocial[registro.z].dataPoints.push({ x: registro.x, y: registro.y });
    }
  
    // Agrega las series al gráfico
    for (const razonSocial in seriesPorRazonSocial) {
      if (seriesPorRazonSocial.hasOwnProperty(razonSocial)) {
        this.chartOptions3.data.push(seriesPorRazonSocial[razonSocial]);
      }
    }
  }
}
