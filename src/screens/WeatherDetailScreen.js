import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View, Text, Button, Alert, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import openWeatherApi from '../api/OpenWeatherApi';
import Constants from 'expo-constants';
import _get from 'lodash.get';
import { LinearGradient } from 'expo-linear-gradient';
import { SliderBox } from "react-native-image-slider-box";

export default class WeatherDetailScreen extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: true,
            
        };
    }

    componentDidMount() {
        this.setState({ isLoading: true });

        openWeatherApi.fetchWeatherInfoByCityName(this.props.route.params.city)
            .then(info => {
                console.log(info);
                this.setState({
                    ...info,
                    isLoading: false
                });
            });
    }

    renderTemperature() {
        const celsius = this.state.main.temp - 273.15;

        return (
            <Text>Temperature: {celsius.toFixed(1)}</Text>
        )
    }

    renderClouds() {
        const clouds = _get(this.state, ['clouds', 'all'], null);

        const cloudStatus = [
            'Clear',
            'Partly Cloudy',
            'Cloudy',
            'Partly Overcast',
            'Overcast'
        ];

        const text = (clouds === null) ? 'Null' : cloudStatus[Math.min(parseInt(clouds / 20), 4)];

        return (
            <Text>Sky: {text}</Text>
        );
    }

    renderWind() {
        const speed = _get(this.state, ['wind', 'speed'], null);
        const deg = _get(this.state, ['wind', 'deg'], null);

        const arrowStyle = {
            transform: [
                { rotate: `${deg}deg` }
            ],
            width: 24,
            height: 24
        };

        return (
            <View style={[styles.inRow, styles.alignItemInCenter]}>
                <Text>
                    Wind Speed: {speed ? `${speed}m/s` : `Null`}
                </Text>

                <View style={[arrowStyle]}>
                    <MaterialCommunityIcons name="arrow-up-circle" size={24} color="black" />
                </View>
            </View>
        );
    }

    renderWeatherCondition() {
        return this.state.weather.map(({
            icon,
            description,
        }, index) => {
            return (
                <View style={styles.weatherCondition} key={index}>
                    <Image source={{
                        uri: `http://openweathermap.org/img/wn/${icon}@2x.png`,
                        width: 72,
                        height: 48
                    }} />
                    <Text style={styles.textCondition}>{description}</Text>
                </View>
            );
        });
    }


    renderDetailWeatherCondition() {
        const feelsLikeTemp = this.state.main.feels_like - 273.15;
        const tempMin = this.state.main.temp_min - 273.15;
        const tempMax = this.state.main.temp_max - 273.15;
        const pressure = this.state.main.pressure;
        const humidity = this.state.main.humidity;

        const clickHandler = () => {
            Alert.alert(
                "Details",
                "Sensible Temperature: " + feelsLikeTemp.toFixed(1) + "°C\n" +
                "Today\'s Min Temperature: " + tempMin.toFixed(1) + "°C\n" +
                "Today\'s Max Temperature: " + tempMax.toFixed(1) + "°C\n" +
               "Pressure: " + pressure + "hPa\n" +
               "Humidity: " + humidity + "%",
                [
                    { text: "OK", onPress: () => console.log("OK Pressed") }
                ],
                { cancelable: false }
            )
        }

        return (
            <View >
                <TouchableOpacity style={styles.button} onPress={clickHandler} >
                    <Text style={styles.text}> Alert Detail Weathers</Text>
                </TouchableOpacity>
            </View>
        )
    }

    renderGoogleMap() {
        const {
            lat, lon
        } = this.state.coord;

        const googleApiKey = _get(Constants, ['manifest', 'extra', 'googleApiKey',], null);

        if (!googleApiKey) {
            return undefined;
        }

        // After generating API key, enable billing to activate API.
        const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&markers=color:red%7C${lat},${lon}&zoom=9&size=400x400&maptype=roadmap&key=${googleApiKey}`;

        const owmApiKeyObject = _get(Constants, ['manifest', 'extra', 'openWeatherApi'], null);
        const owmApiKey = owmApiKeyObject['apiKey'];
        console.log(owmApiKey);
        const images = [
            "https://tile.openweathermap.org/map/clouds_new/1/1/1.png?appid=" + owmApiKey,
            "https://tile.openweathermap.org/map/precipitation_new/1/1/1.png?appid=" + owmApiKey,
            "https://tile.openweathermap.org/map/pressure_new/1/1/1.png?appid=" + owmApiKey,
            "https://tile.openweathermap.org/map/wind_new/1/1/1.png?appid=" + owmApiKey,
            "https://tile.openweathermap.org/map/temp_new/1/1/1.png?appid=" + owmApiKey,
        ];

        return (
            <View style={styles.mapContainer}>
                {/* <Image style={styles.mapImage}
                    resizeMode={'stretch'}
                    resizeMethod={'scale'}
                    source={{ uri: url }}
                /> */}
                <SliderBox
                    images={images}
                    sliderBoxHeight={400}
                />
            </View>
        );
    }

    render() {
        const {
            route: {
                params: { city }
            },
            navigation
        } = this.props;

        navigation.setOptions({ title: `Weather Information:  ${city}` });

        if (this.state.isLoading) {
            return (
                <View style={styles.container}>
                    <ActivityIndicator size="large" />
                </View>
            )
        }

        const briefWeatherInfo = this.state.weather[0].main;

        // try {
        return (
            <LinearGradient colors={weatherConditions[briefWeatherInfo].gradient} style={styles.container}>
                <View>
                    {this.renderClouds()}
                    {this.renderTemperature()}
                    {this.renderWind()}
                    <View style={styles.inRow}>
                        {this.renderWeatherCondition()}
                    </View>

                    {this.renderDetailWeatherCondition()}

                    {this.renderGoogleMap()}
                </View>
            </LinearGradient>
        );
    } catch(e) {
        return (
            <LinearGradient colors={weatherConditions["Error"].gradient} style={styles.container}>
                <View>
                    <Text style={styles.textCondition_error}>데이터를 로드하는데 실패하였습니다</Text>
                </View>
            </LinearGradient>
        );
    }
}

const weatherConditions = {
    "Thunderstorm": {
        gradient: ["#1F1C2C", "#928DAB"]
    },
    "Drizzle": {
        gradient: ["#59C173", "#5D26C1"]
    },
    "Rain": {
        gradient: ["#005AA7", "#FFFDE4"]
    },
    "Snow": {
        gradient: ["#E0EAFC", "#CFDEF3"]
    },
    "Atmosphere": {
        gradient: ["#FC5C7D", "#6A82FB"]
    },
    "Clear": {
        gradient: ["#e1eec3", "#f05053"]
    },
    "Clouds": {
        gradient: ["#4ECDC4", "#556270"]
    },
    "Error": {
        gradient: ["#636363", "#a2ab58"]
    },
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    button: {
        width: 200,
        height: 40,
        backgroundColor: "gray",
        borderColor: 'black',
        borderWidth: 5,
        borderRadius: 10,
        shadowColor: "gray",
        shadowOffset: {
            width: 0,
            height: 11,
        },
        shadowOpacity: 0.57,
        shadowRadius: 15.19,
        elevation: 23,
    },
    text: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    inRow: {
        flexDirection: 'row'
    },

    alignItemInCenter: {
        alignItems: 'center'
    },

    mapContainer: {
        width: '90%',
        borderWidth: 1,
        borderColor: '#2222AA'
    },

    mapImage: {
        aspectRatio: 1
    },

    weatherCondition: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },

    textCondition: {
        color: '#FFF'
    },

    textCondition_error: {
        color: 'black'
    },

    rotation: {
        width: 50,
        height: 50,
        transform: [{ rotate: "5deg" }]
    }
});