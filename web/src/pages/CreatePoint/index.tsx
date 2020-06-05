import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet'

import Dropzone from '../../components/Dropzone';

import api from '../../services/api';
import axios from 'axios';

import './styles.css';
import logo from '../../assets/logo.svg';

const CreatePoint = () => {

	const [items, setItems] = useState<Item[]>([]);
	const [ufs, setUfs] = useState<UF[]>([]);
	const [cities, setCities] = useState<City[]>([]);
	const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);

	const [formData, setFormData] = useState({
		name: '',
		email: '',
		whatsapp: ''
	});

	const [selectedUF, setSelectedUF] = useState("0");
	const [selectedCity, setSelectedCity] = useState("0");
	const [selectedItems, setSelectedItems] = useState<number[]>([]);
	const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
	const [selectedFile, setSelectedFile] = useState<File>();

	const history = useHistory();

	//carrega itens de coleta
	useEffect(() => {
		(async () => {
			const response = await api.get('/items');
			setItems(response.data);
		})();
	}, []);

	//carrega estados
	useEffect(() => {
		(async () => {
			const response = await axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados');

			const ufs = response.data.map<UF>(it => {
				const uf: UF = { id: it.id, name: it.sigla };
				return uf;
			});

			setUfs(ufs.sort((a, b) => a.name.localeCompare(b.name)));
		})();
	}, []);

	//carrega cidades
	useEffect(() => {
		(async () => {
			//limpa cidades
			setCities([]);

			const response = await axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/distritos`);

			const cities = response.data.map(it => {
				const city: City = { id: it.id, name: it.nome };
				return city;
			});

			setCities(cities.sort((a, b) => a.name.localeCompare(b.name)));
		})();
	}, [selectedUF]);

	//carregar localizacao atual
	useEffect(() => {
		navigator.geolocation.getCurrentPosition(position => {
			const { latitude, longitude } = position.coords;
			setInitialPosition([latitude, longitude]);
		});

	}, [])

	function handleSelectUF(event: ChangeEvent<HTMLSelectElement>) {
		const value = event.target.value;
		setSelectedUF(value);
	}

	function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
		const value = event.target.value;
		setSelectedCity(value);
	}

	function handleMapClick(event: LeafletMouseEvent) {
		setSelectedPosition([
			event.latlng.lat,
			event.latlng.lng
		])
	}

	function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.target;
		setFormData({ ...formData, [name]: value });
	}

	function handleSelectItem(id: number) {
		const alreadySelected = selectedItems.includes(id);

		if (alreadySelected) {
			const filteredItems = selectedItems.filter(it => it !== id);
			setSelectedItems(filteredItems);
		} else {
			setSelectedItems([...selectedItems, id]);
		}
	}

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();

		const { name, email, whatsapp } = formData;
		const uf = selectedUF;
		const city = selectedCity;
		const [latitude, longitude] = selectedPosition;
		const items = selectedItems;

		const data = new FormData();
		data.append('name', name);
		data.append('email', email);
		data.append('whatsapp', whatsapp);
		data.append('uf', uf);
		data.append('city', city);
		data.append('latitude', String(latitude));
		data.append('longitude', String(longitude));
		data.append('items', items.join(','));

		if (selectedFile) {
			data.append('image', selectedFile);
		}

		await api.post('/points', data);
		alert('Ponto de coleta cadastrado.');

		history.push('/');
	}

	return (
		<div id="page-create-point">
			<header>
				<img src={logo} alt="Ecoleta" />
				<Link to="/">
					<FiArrowLeft />
					Voltar para home
				</Link>
			</header>

			<form onSubmit={handleSubmit}>
				<h1>Cadastro do ponto de coleta</h1>

				<Dropzone onFileUploaded={setSelectedFile} />

				<fieldset>
					<legend>
						<h2>Dados</h2>
					</legend>

					<div className="field">
						<label htmlFor="name">Nome da entidade</label>
						<input
							onChange={handleInputChange}
							value={formData.name}
							type="text"
							name="name"
							id="name"
						/>
					</div>

					<div className="field-group">
						<div className="field">
							<label htmlFor="email">Email</label>
							<input
								onChange={handleInputChange}
								value={formData.email}
								type="email"
								name="email"
								id="email"
							/>
						</div>

						<div className="field">
							<label htmlFor="whatsapp">Whatsapp</label>
							<input
								onChange={handleInputChange}
								value={formData.whatsapp}
								type="text"
								name="whatsapp"
								id="whatsapp"
							/>
						</div>
					</div>
				</fieldset>

				<fieldset>
					<legend>
						<h2>Endereço</h2>
						<span>Selecione um enderço no mapa</span>
					</legend>

					<Map
						center={initialPosition}
						zoom={16}
						onClick={handleMapClick}
					>
						<TileLayer
							attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						/>
						<Marker position={selectedPosition} />
					</Map>

					<div className="field-group">
						<div className="field">
							<label htmlFor="uf">Estado (UF)</label>
							<select
								onChange={handleSelectUF}
								value={selectedUF}
								name="uf"
								id="uf">
								<option value="0">Selecione uma UF</option>
								{
									ufs.map(it => (
										<option key={it.id} value={it.name}>{it.name}</option>
									))
								}
							</select>
						</div>
						<div className="field">
							<label htmlFor="city">Cidade</label>
							<select
								onChange={handleSelectCity}
								value={selectedCity}
								disabled={cities.length === 0}
								name="city"
								id="city">
								<option value="0">Selecione uma cidade</option>
								{
									cities.map(it => (
										<option key={it.id} value={it.name}>{it.name}</option>
									))
								}
							</select>
						</div>
					</div>
				</fieldset>

				<fieldset>
					<legend>
						<h2>Itens de Coleta</h2>
						<span>Selecione um ou mais itens abaixo</span>
					</legend>


					<ul className="items-grid">
						{
							items.map(it => (
								<li
									key={it.id}
									onClick={() => handleSelectItem(it.id)}
									className={selectedItems.includes(it.id) ? "selected" : ""}
								>
									<img src={it.image_url} alt="test" />
									<span>{it.title}</span>
								</li>
							))
						}
					</ul>
				</fieldset>

				<button type="submit">
					Cadastrar ponto de coleta
				</button>
			</form>
		</div >
	);
}

interface Item {
	id: number,
	title: string,
	image_url: string
}

interface UF {
	id: number,
	name: string
}

interface City {
	id: number,
	name: string
}

interface IBGEUFResponse {
	id: number,
	sigla: string
}

interface IBGECityResponse {
	id: number,
	nome: string
}

export default CreatePoint;