
import React from 'react'
import { View, Text, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Alert, Dimensions } from 'react-native'
import { formatDate, formatTime } from '../util'
import ENV from '../../variables'
import { connect } from 'react-redux'

const { width, height } = Dimensions.get('window')

class PickupRequest extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            time: null,
            provided_times: ['5', '10', '15', '20', '25'],
            colors: ['#ffe1d0', '#ffddb7', '#fff1b5', '#dcf3d0', '#b5e9e9'],
            hightlighted_colors: ['#fa625f', '#ff8944', '#f4d41f', '#00c07f', '#368cbf'],
            choose_other_option: false,
            total_height: height - 55,
            total_width: width
        }
        this.sendRequest = this.sendRequest.bind(this)
    }

    onBlur() {
        const { time, choose_other_option, provided_times } = this.state
        if (choose_other_option && (time === '' || provided_times.includes(time))) {
            this.setState({ choose_other_option: false })
        } 
    }

    sendRequest() {
        const { isConnected } = this.props
        if (!isConnected) {
            alert('網路連不到! 請稍後再試試看')
            return
        }
        const { child_id, school_id } = this.props.route.params
        const query = `https://iejnoswtqj.execute-api.us-east-1.amazonaws.com/${ENV}/attendance/pickup-request`
        const student_id = child_id
        const arrival_time = new Date()
        arrival_time.setMinutes(arrival_time.getMinutes() + parseInt(this.state.time))
        const request_body = {
            school_id,
            student_id,
            arrival_time: formatDate(arrival_time) + ' ' + formatTime(arrival_time)
        }
        fetch(query, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request_body)
        })
            .then(res => res.json())
            .then(resJson => {
                const { statusCode, message } = resJson
                if (statusCode > 200 || message === 'Internal server error') {
                    alert('Sorry 電腦出狀況了！請截圖和與工程師聯繫 ' + message)
                    return
                }
                this.props.navigation.goBack()
            })
            .catch(err => {
                alert('Sorry 電腦出狀況了！請截圖和與工程師聯繫: error occurred when sending pickup request')
            })
    }

    render() {
        const { time, provided_times, colors, hightlighted_colors, choose_other_option, total_height, total_width } = this.state
        return (
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior="padding"
                keyboardVerticalOffset={100}
                enabled
            >
                <ScrollView>
                    <View
                        style={{
                            flex: 3,
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {provided_times.map((minute, index) => {
                            return (
                                <View
                                    key={index}
                                    style={{
                                        width: '50%',
                                        height: total_height*0.28,
                                        // aspectRatio,
                                        backgroundColor: time == minute ? hightlighted_colors[index] : colors[index],
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <TouchableOpacity
                                        style={{
                                            width: '90%',
                                            height: '90%',
                                            borderWidth: time == minute ? 5 : 0,
                                            borderColor: 'white',
                                            backgroundColor: time == minute ? hightlighted_colors[index] : colors[index]
                                        }}
                                        underlayColor={hightlighted_colors[index]}
                                        onClick={() => this.setState({ time: minute, choose_other_option: false })}
                                    >
                                        <View style={{ flex:1, flexDirection:'row', justifyContent: 'center', alignItems: 'center' }}>
                                            <Text style={{ fontSize: total_width*0.20 }}>{minute}</Text>
                                            <Text style={{ fontSize: total_width*0.09 }}>分鐘</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            )
                        })}
                        
                        
                        <View
                            style={{
                                width: '50%',
                                height: total_height*0.28,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: choose_other_option ? 'black' : 'white'
                            }}
                        >
                            <TouchableOpacity
                                    style={{
                                        flexDirection: 'row',
                                        width: '90%',
                                        height: '90%',
                                        backgroundColor: choose_other_option ? 'black' : 'white',
                                        borderWidth: choose_other_option ? 5 : 0,
                                        borderColor: 'white',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                    onClick={() => this.setState({ choose_other_option: true, time: '' })}
                            >
                                {choose_other_option ?
                                    <View
                                        style={{
                                            flexDirection: 'row',
                                            justifyContent: 'center', 
                                            alignItems: 'center',
                                            width: '100%'
                                        }}
                                    >
                                        <TextInput
                                            autoFocus={true}
                                            selectTextOnFocus={true}
                                            onBlur={() => this.onBlur()}
                                            keyboardType='numeric'
                                            value={time + ''}
                                            style={{
                                                fontSize: total_width*0.2,
                                                color: 'white',
                                                width: '100%'
                                            }}
                                            onChangeText={(time) => {
                                                this.setState({ time })
                                            }}
                                        />
                                            <Text style={{ fontSize: total_width*0.09, color: 'white' }}>分鐘</Text>                            
                                    </View>
                                    : <Text style={{ fontSize: 50 }}>其他</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={{ height: total_height*0.16 }}>
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                backgroundColor: 'lightgrey',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            onClick={() => this.sendRequest()}
                        >
                            <Text style={{ fontSize: 50 }}>送出</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        isConnected: state.parent.isConnected
    }
}

export default connect(mapStateToProps) (PickupRequest)