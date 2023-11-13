import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/auth/shared/services/user.service';
import { ListadoDataSource            } from 'src/app/shared/listado.datasource';
import { ListadoComponent } from 'src/app/shared/listados/listado.component';
import { User } from 'src/app/shared/models/user.model';
import { ApiService } from 'src/app/shared/services/api.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-indicador-vendedores',
  templateUrl: './indicador-vendedores.component.html',
  styleUrls: ['./indicador-vendedores.component.scss']
})
export class IndicadorVendedoresComponent extends ListadoComponent implements OnInit {

  public currentUser?         : User;
  public productos            : Array<any> = [];
  public puertos              : Array<any> = [];
  public formas_pago          : Array<any> = [];
  public chartOptions         : any;
  public chartOptions2        : any;
  public chartOptions3        : any;
  public data_negocios        : { x: Date, y: number, z: string }[] = [];
  /*public data_sin_cerrar      : { x: Date, y: number, z: string }[] = [];
  public data_eliminada       : { x: Date, y: number, z: string }[] = [];*/
  public chartOptions4        : any;
  public chartOptions5        : any;
  public chartOptions6        : any;
  public chartOptions7        : any;
  public data_montos_usd      : { x: number, y: string}[] = [];
  public data_montos_comis_usd : { x: number, y: string }[] = [];
  public data_montos_ars      : { x: number, y: string}[] = [];
  public data_montos_comis_ars: { x: number, y: string }[] = [];

  //Filtros
  public filtroPeriodo       : string= '%Y';
  public filtroProducto      : string = '';
  public filtroPuerto        : string = '';
  public filtroFormaPago     : string = '';

  constructor(
    public  dataSource         : ListadoDataSource<any>,
    private apiService         : ApiService,
    private userService        : UserService,
  ) { 
    super();
  }

  ngOnInit(): void {
    this.dataSource.uri = '/indicadores/mercado/vendedores';
    this.dataSource.afterFetch.subscribe((data) => {
      this.data_negocios.length=0;
      /*this.data_sin_cerrar.length=0;
      this.data_eliminada.length=0;*/
      this.data_montos_usd.length=0;
      this.data_montos_ars.length=0;
      this.data_montos_comis_ars.length=0;
      this.data_montos_comis_usd.length=0;
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
          /*this.data_sin_cerrar.push({ x: fecha, y: +elemento.Activa, z: elemento.razon_social});
          this.data_eliminada.push({ x: fecha, y: +elemento.Eliminada, z: elemento.razon_social});*/
        })
        this.dibujarGraficoDiario(); 
        /*this.dibujarGraficoDiarioSinCerrar();
        this.dibujarGraficoDiarioEliminadas();*/
      }
      if(this.filtroPeriodo ==='%Y-%m'){
        this.dataSource.currentData.forEach((elemento)=>{
          const periodo = elemento.periodo;
          const [anioStr, mesStr] = periodo.split('-');
          const anio = parseInt(anioStr, 10);
          const mes = parseInt(mesStr, 10);
          const fecha = new Date(anio, mes - 1);
          this.data_negocios.push({ x: fecha, y: +elemento.Cerrada, z: elemento.razon_social }); 
          /*this.data_sin_cerrar.push({ x: fecha, y: +elemento.Activa, z: elemento.razon_social }); 
          this.data_eliminada.push({ x: fecha, y: +elemento.Eliminada, z: elemento.razon_social});*/
          
        })
        this.dibujarGraficoMensual(); 
        /*this.dibujarGraficoMensualSinCerrar();
        this.dibujarGraficoMensualEliminadas();*/
      }
      if(this.filtroPeriodo ==='%Y'){
        this.dataSource.currentData.forEach((elemento)=>{
          const periodo = elemento.periodo;
          this.data_negocios.push({ x: new Date(periodo, 0), y: +elemento.Cerrada, z: elemento.razon_social });  
          /*this.data_sin_cerrar.push({ x: new Date(periodo, 0), y: +elemento.Activa, z: elemento.razon_social }); 
          this.data_eliminada.push({ x: new Date(periodo, 0), y: +elemento.Eliminada, z: elemento.razon_social }); */
          this.data_montos_usd.push({  x: +elemento.Monto_USD, y: elemento.razon_social}); 
          this.data_montos_comis_usd.push({ x: +elemento.Monto_comis_USD, y: elemento.razon_social}); 
          this.data_montos_ars.push({  x: +elemento.Monto_ARS, y: elemento.razon_social}); 
          this.data_montos_comis_ars.push({ x: +elemento.Monto_comis_ARS, y: elemento.razon_social}); 
        })
        console.log("this.data_montos_usd", this.data_montos_usd);
        console.log("this.data_montos_comis_usd", this.data_montos_comis_usd);
        console.log("this.data_montos_ars", this.data_montos_ars);
        console.log("this.data_montos_comis_ars", this.data_montos_comis_ars);
        this.dibujarGraficoAnual(); 
        this.dibujarBarras();
        this.dibujarBarrasComisiones();
        this.dibujarBarrasARS();
        this.dibujarBarrasComisionesARS();
        /*this.dibujarGraficoAnualSinCerrar();
        this.dibujarGraficoAnualEliminadas();*/
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
    
    if(this.dataSource.currentData.length > 0){
      if(this.filtroPeriodo ==='%Y-%m%-%d' ){
        this.dibujarGraficoDiario(); 
        /*this.dibujarGraficoDiarioSinCerrar();
        this.dibujarGraficoDiarioEliminadas();*/
      }
      if(this.filtroPeriodo ==='%Y-%m' ){
        this.dibujarGraficoMensual();
        /*this.dibujarGraficoMensualSinCerrar();
        this.dibujarGraficoMensualEliminadas();*/
      }
      if(this.filtroPeriodo ==='%Y' ){
        this.dibujarGraficoAnual();
        /*this.dibujarGraficoAnualSinCerrar();
        this.dibujarGraficoAnualEliminadas();*/
      }
    }
    this.dataSource.refreshData();
  }

  private setTable(): void {
    this.addColumn('periodo',    'Periodo',    '80px');
    this.addColumn('razon_social',    'Razón social',    '100px');
    this.addColumn('Cerrada',    'Negocios cerrados',    '40px');
    this.addColumn('Montos','Vendido (USD)', '100px').renderFn(row => row.Monto_USD? 'USD '+ (row.Monto_USD as number).toFixed(2) : '-' );
    this.addColumn('Monto_comis_USD','Comisiones (USD)', '90px').renderFn(row => row.Monto_comis_USD? 'USD '+ (row.Monto_comis_USD as number).toFixed(2) : '-').setAlign('center');
    this.addColumn('Monto_ARS','Vendido (ARS)', '80px').renderFn(row => row.Monto_ARS? 'ARS '+(row.Monto_ARS as number).toFixed(2) : '-').setAlign('center');
    this.addColumn('Monto_comis_ARS','Comisiones (ARS)', '110px').renderFn(row => row.Monto_comis_ARS? 'ARS '+row.Monto_comis_ARS : '-').setAlign('center');
    /*this.addColumn('Activa',    'Sin cerrar',    '100px');
    this.addColumn('Eliminada',    'Eliminadas',    '100px');
    this.addColumn('Total',    'Total de Órdenes',    '30px');*/
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
  }

  public onClearFilters() {
    this.filtroPeriodo       = '%Y';
    this.filtroProducto      = '';
    this.filtroPuerto         = '';
    this.filtroFormaPago      = '';
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

  public exportToXLSX(): void {
    // Crear una hoja de cálculo de datos
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.dataSource.currentData);
  
    // Crear un libro de Excel
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vendedores'); // nnombre de la hoja
  
    // Guardar el archivo en formato .xlsx
    XLSX.writeFile(wb, 'vendedores.xlsx');
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

  public dibujarBarras (){
    let chart: any;
    const dataPoints = this.data_montos_usd.map(item => ({
      label: item.y,  // Usamos el valor 'y' como etiqueta
      y: item.x  // Usamos el valor 'x' como valor
    }));
    this.chartOptions4 = {
      title:{
        text: "Montos vendidos en USD por empresa",
        fontFamily: "Poppins", 
        fontSize: 22,
        fontWeight: 500
      },
      animationEnabled: true,
      axisY: {
        includeZero: true
      },
      data: [{
        type: "bar",
        dataPoints: dataPoints
      }]
    }	
  }

  public dibujarBarrasComisiones (){
    let chart: any;
    const dataPoints = this.data_montos_comis_usd.map(item => ({
      label:  item.y,  // Usamos el valor 'y' como etiqueta
      y:  item.x  // Usamos el valor 'x' como valor
    }));
    this.chartOptions5 = {
      title:{
        text: "Comisiones en USD por empresa",
        fontFamily: "Poppins", 
        fontSize: 22,
        fontWeight: 500
      },
      animationEnabled: true,
      axisX: {
        text: 'USD'
      },
      axisY: {
        includeZero: true
      },
      data: [{
        type: "bar",
        dataPoints: dataPoints
      }]
    }	
  }

  public dibujarBarrasARS (){
    let chart: any;
    const dataPoints = this.data_montos_ars.map(item => ({
      label: item.y,  // Usamos el valor 'y' como etiqueta
      y: item.x  // Usamos el valor 'x' como valor
    }));
    this.chartOptions6 = {
      title:{
        text: "Montos vendidos en ARS por empresa",
        fontFamily: "Poppins", 
        fontSize: 22,
        fontWeight: 500
      },
      animationEnabled: true,
      axisY: {
        includeZero: true
      },
      data: [{
        type: "bar",
        dataPoints: dataPoints
      }]
    }	
  }

  public dibujarBarrasComisionesARS (){
    let chart: any;
    const dataPoints = this.data_montos_comis_ars.map(item => ({
      label:  item.y,  // Usamos el valor 'y' como etiqueta
      y:  item.x  // Usamos el valor 'x' como valor
    }));
    this.chartOptions7 = {
      title:{
        text: "Comisiones en ARS por empresa",
        fontFamily: "Poppins", 
        fontSize: 22,
        fontWeight: 500
      },
      animationEnabled: true,
      axisX: {
        text: 'ARS'
      },
      axisY: {
        includeZero: true
      },
      data: [{
        type: "bar",
        dataPoints: dataPoints
      }]
    }	
  }

  /*
  public dibujarGraficoAnualSinCerrar() {
    let chart: any;
    this.chartOptions2 = {
      animationEnabled: true,
      title: {
        text: "Órdenes de venta sin cerrar por período",
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
        title: "Órdenes de venta"
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
      text: "Órdenes de venta sin cerrar por período",
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
      title: "Órdenes de venta"
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

  public dibujarGraficoDiarioSinCerrar(){
    let chart: any ;
    this.chartOptions2 = {
      animationEnabled: true,
      //marginTop: 100,
      title:{
      text: "Órdenes de venta no cerradas por período",
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
      title: "Órdenes de venta"
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
        text: "Órdenes de venta eliminadas por período",
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
        title: "Órdenes de venta"
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
      text: "Órdenes de venta eliminadas por período",
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
      title: "Órdenes de venta"
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
      text: "Órdenes de venta eliminadas por período",
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
      title: "Órdenes de venta"
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
  */
}
