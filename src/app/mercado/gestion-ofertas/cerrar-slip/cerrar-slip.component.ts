import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { ActivatedRoute, Router } from '@angular/router';
import * as moment from 'moment';
import { FormBaseComponent } from 'src/app/shared/form-base.component';
import { ListadoDataSource } from 'src/app/shared/listado.datasource';
import { LocatorService } from 'src/app/shared/services/locator.service';

@Component({
  selector: 'app-cerrar-slip',
  templateUrl: './cerrar-slip.component.html',
  styleUrls: ['./cerrar-slip.component.scss']
})
export class CerrarSlipComponent extends FormBaseComponent implements OnInit {

    protected get dataUrl(): string {
        return `/mercado/ordenes/${this.orden_id}:cerrarSlip`;
    }
        public errorMessage                  : string = ''; 
        public title                         : string = "Cerrar negocio"
        public posicion                      : any;
        public clave?                        : String;
        public orden_id?                     : number;
        public listaEmpresas?                : Array<any>;
        public moneda_posicion?              : string;
        public autocompletarPosicionForm?    : boolean;
        public orden                         : any ;
        public usuarios?                     : Array<any>;
        public isLoading                     : boolean = false; // Variable para controlar el spinner
        
        protected fb  = LocatorService.injector.get(FormBuilder);


        public constructor(
            public  dataSource  : ListadoDataSource<any>,
            private router      : Router,
            private route       : ActivatedRoute,
        ) {
            super();
        }

    public async ngOnInit(): Promise<void> {
        this.createForm();
        this.watchRoute();
    }

    private async watchRoute() {
        this.orden_id = this.route.snapshot.params.orden;
        this.route.params.subscribe(async (params) => {
            if (params.clave) {
                this.clave = params.clave;
                this.posicion = await this.apiService.getData(`/mercado/panel/${this.clave}`).toPromise();
                this.moneda_posicion = this.posicion.moneda;
                this.listaEmpresas = [this.posicion.empresa];
                //this.listaPosiciones = [this.posicion];
                this.autocompletarPosicionForm = true;
                
                if (this.posicion) {
                    this.completarFormConPosicion();
                }

                if (this.autocompletarPosicionForm) {
                    this.form?.get('posicion_id')?.setValue(this.posicion.id);
                }
            }
        });
    }

    private async createForm() {
        this.orden_id = this.route.snapshot.params.orden;
        this.form = this.fb.group({
            //password: new FormControl('', [Validators.required, this.minLength(8)]),
            //posicion de compra
            producto_posicion              : new FormControl({ value: '',    disabled: false  }),
            empresa_posicion               : new FormControl({ value: '',    disabled: false  }),
            comision_comprador             : new FormControl({ value: '',    disabled: false  }),
            comision_comprador_cierre      : new FormControl({ value: '',    disabled: false  }),
            destino_posicion               : new FormControl({ value: '',    disabled: false  }),
            precio_posicion                : new FormControl({ value: '',    disabled: false  }),
            forma_pago_posicion            : new FormControl({ value: '',    disabled: false  }),
            cosecha_posicion               : new FormControl({ value: '',    disabled: false  }),
            observaciones_posicion         : new FormControl({ value: '',    disabled: false  }),
            usuario_carga_posicion         : new FormControl({ value: '',    disabled: false  }),
            volumen_posicion               : new FormControl({ value: '',    disabled: false  }),
            
            //orden de venta:
            volumen                        : new FormControl({ value: '',    disabled: false  }),
            posicion_id                    : new FormControl({ value: '',    disabled: false  }),
            producto_orden                 : new FormControl({ value: '',    disabled: false  }),
            empresa_orden                  : new FormControl({ value: '',    disabled: false  }),
            comision_vendedor              : new FormControl({ value: '',    disabled: false  }),
            comision_vendedor_cierre       : new FormControl({ value: '',    disabled: false  }),
            destino_orden                  : new FormControl({ value: '',    disabled: false  }),
            precio_orden                   : new FormControl({ value: '',    disabled: false  }),
            forma_pago_orden               : new FormControl({ value: '',    disabled: false  }),
            observaciones_orden            : new FormControl({ value: '',    disabled: false  }),
            cosecha_orden                  : new FormControl({ value: '',    disabled: false  }),
            usuario_carga_orden            : new FormControl({ value: '',    disabled: false  }),

            //datos de cierre
            precio_cierre_slip             : new FormControl({ value: '',    disabled: false  }),
            toneladas_cierre               : new FormControl({ value: '',    disabled: false  })
            
            
        });

        this.form?.get('posicion_id')?.valueChanges.subscribe(async (value) => {
            if (value) {
                this.posicion = await this.apiService.getData(`/mercado/panel/${value}`).toPromise();
                
                this.completarFormConPosicion();
            }
        });


    }

    private async completarFormConPosicion(){
       
        const relations = 'empresa,producto,puerto,condicionPago,usuarioCarga,cosecha';
        this.orden = await this.apiService.getData('/mercado/ordenes/' + this.orden_id, { with_relation: relations }).toPromise();
        console.log('this.orden',this.orden);
        this.usuarios = await this.apiService.getData('/usuarios').toPromise();
        //this.form.get('posicion_id').setValue(this.posicion.id);
        this.form?.get('empresa_posicion')?.setValue(this.posicion.empresa.razon_social);
        this.form?.get('comision_comprador')?.setValue(this.posicion.empresa.comision? this.posicion.empresa.comision+'%': 0+'%');
        this.form?.get('comision_comprador_cierre')?.setValue(this.posicion.empresa.comision? this.posicion.empresa.comision :0);
        
        this.form?.get('producto_posicion')?.setValue(this.posicion.producto.nombre);
        this.form?.get('destino_posicion')?.setValue(this.posicion.puerto.nombre);
        this.form?.get('precio_posicion')?.setValue(this.posicion.moneda + ' ' +this.posicion.precio);
        this.form?.get('forma_pago_posicion')?.setValue(this.posicion.condicion_pago?.descripcion);
        this.form?.get('cosecha_posicion')?.setValue(this.posicion.cosecha.descripcion);
        this.form?.get('volumen_posicion')?.setValue(this.posicion.volumen);
        this.form?.get('usuario_carga_posicion')?.setValue(this.usuarios?.find(usuario => usuario.id == this.posicion.usuario_carga_id).nombreCompleto);
        this.form?.get('observaciones_posicion')?.setValue(this.posicion.observaciones? this.posicion.observaciones : '-');

        //orden de venta
        this.form?.get('empresa_orden')?.setValue(this.orden.empresa.razon_social);
        this.form?.get('comision_vendedor')?.setValue(this.orden.empresa.comision?this.orden.empresa.comision+'%': 0+'%');
        this.form?.get('comision_vendedor_cierre')?.setValue(this.orden.empresa.comision?this.orden.empresa.comision: 0);
        this.form?.get('cosecha_orden')?.setValue(this.orden.cosecha.descripcion);
        this.form?.get('volumen')?.setValue(this.orden.volumen);
        this.form?.get('producto_orden')?.setValue(this.orden.producto.nombre);
        this.form?.get('observaciones_orden')?.setValue(this.orden.observaciones? this.orden.observaciones : '-');
        this.form?.get('destino_orden')?.setValue(this.orden.puerto.nombre);
        this.form?.get('precio_orden')?.setValue(this.orden.moneda +' '+ this.orden.precio);
        this.form?.get('usuario_carga_orden')?.setValue(this.orden.usuario_carga.nombreCompleto);
        this.form?.get('forma_pago_orden')?.setValue(this.orden.condicion_pago.descripcion);

        //datos cierre
        this.form?.get('precio_cierre_slip')?.setValue(this.posicion.precio);
        //this.form?.get('toneladas_cierre')?.setValue(this.posicion.volumen);
    }

    public infoEmpresaPosicion(posicion: any) {
        var precio = posicion.precio + ' ' + this.moneda_posicion;
        return (posicion.id + " - " + posicion.empresa.razon_social + ' - ' + precio);
    }

    public guardar() {
        this.isLoading = true;

        // Obtener el valor del campo de entrada y reemplazar comas por puntos.
        const volumen = this.form?.get('toneladas_cierre')?.value.replace(',', '.');

        // Asignar el valor transformado de vuelta al campo de entrada.
        this.form?.get('toneladas_cierre')?.setValue(volumen);

        this.enviarDatos().subscribe(
            (data: any) => {
                this.messages.show('Datos guardados correctamente').subscribe(() => {
                    this.isLoading = false;
                    this.router.navigateByUrl(`/app/mercado/panel`);
                });
            },
            (error: any) => {
                this.isLoading = false; 
                //console.error('Error al enviar datos:', error);
                this.errorMessage = 'Las toneladas ingresadas no pueden exceder las toneladas de la orden de venta.';
                this.messages.show(this.errorMessage);
            }
        );      
    }

    public validar(toneladas_cierre: number) {
        if(toneladas_cierre > this.orden.volumen){

        }
    }
}
