import React from 'react'
import { StyleSheet, Image, TouchableHighlight, TextInput, Text, View, KeyboardAvoidingView, Alert, Keyboard } from 'react-native'
import { Container, Content, Card, CardItem, Body, Button, Toast } from 'native-base'
import { connect } from 'react-redux';
import Header from '../../header'
import { bindActionCreators } from 'redux';
import {
    rateAppetite,
    clearRatings,
    setAllRatingsToGreat,
    setAllDrinkWater,
    fetchClassAppetiteData,
    onSendAppetiteSuccess,
    alertErrMessage,
    markWaterDrank,
    editFruitName,
    clearAppetiteErrorMessage,
    addStudentIdForUpdate
} from '../../../redux/school/actions/index'
import { formatDate, fetchClassData, beautifyDate } from '../../util'
import TimeModal from '../../parent/timemodal'

class TeacherAppetiteLog extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            date: new Date(),
            isLoading: true,
            mealType: '',
            selectedForCustomize: new Set(),
            editingFruitType: false,
            students_with_records: [],
            showDateTimeModal: false,
            display_all_students: true,
            students_to_display: new Set()
        }
        this.handleRateFoodWellness = this.handleRateFoodWellness.bind(this)
        this.handleSend = this.handleSend.bind(this)
        this.handleClearAll = this.handleClearAll.bind(this)
        this.handleSetAll = this.handleSetAll.bind(this)
        this.handleAllDrank = this.handleAllDrank.bind(this)
    }

    componentDidMount() {
        const { date, teacher_name } = this.props.route.params
        const { updatedStudents } = this.props.appetite
        const { isConnected, students } = this.props.class
        this.setState({
            students_to_display: new Set(Object.keys(students))
        })
        if (updatedStudents.size > 0 || !isConnected) {
            this.setState({
                isLoading: false
            })
        } else {
            this.setState({ date })
            this.fetchClassData(date)
        }

        if (!isConnected) {
            Toast.show({
                text: '網路連線連不到! 等一下再試試看',
                buttonText: 'Okay',
                position: "top",
                type: "danger",
                duration: 4000
            })
        }
        
        this.props.navigation.setOptions({ 
            title: `飲食 - ${teacher_name}`
        })
    }

    async fetchClassData(propsDate) {
        this.props.navigation.setOptions({ 
            headerRight: () => (
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#f4d41f', marginRight: 20 }} />
            )
        })
        const date = new Date(propsDate)
        const start_date = formatDate(date)
        date.setDate(date.getDate() + 1)
        const end_date = formatDate(date)
        const appetiteData = await fetchClassData('appetite', this.props.class.class_id, start_date, end_date)
        if (appetiteData.data[start_date] === undefined) {
            this.props.navigation.setOptions({ 
                headerRight: () => (
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#00c07f', marginRight: 20 }} />
                )
            })
            return 
        }
        const { fruit_name, ratings } = appetiteData.data[start_date]
        this.props.fetchClassAppetiteData(fruit_name, ratings)
        this.setState({
            isLoading: false,
            students_with_records: Object.keys(ratings)
        })
        this.props.navigation.setOptions({ 
            headerRight: () => (
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#00c07f', marginRight: 20 }} />
            )
        })
    }

    editFruitName(fruit_name) {
        this.props.editFruitName(fruit_name)
    }

    fruitNameEditorOnBlur() {
        const { students_with_records } = this.state
        this.setState({ editingFruitType: false })
        if (this.props.appetite.fruit_name === '') {
            this.props.editFruitName('水果')
        }

        if (students_with_records.length > 1) {
            this.props.addStudentIdForUpdate(students_with_records)
        }
    }

    handleRateFoodWellness(student_id, rating) {
        if (this.state.mealType === '') {
            Toast.show({
                text: '請選擇餐時',
                buttonText: 'Okay',
                position: 'top',
                duration: 3000
            })
        } else {
            const { selectedForCustomize } = this.state
            const {teacher_id } = this.props.route.params
            selectedForCustomize.delete(student_id)
            this.setState({
                selectedForCustomize
            })
            this.props.rateAppetite(student_id, this.state.mealType, rating, teacher_id)
        }
    }

    onClickOther(student_id) {
        const { mealType, selectedForCustomize } = this.state
        const {teacher_id } = this.props.route.params
        if (mealType === '') {
            Toast.show({
                text: '請選擇餐時',
                buttonText: 'Okay',
                position: 'top',
                duration: 3000
            })
        } else {
            this.setState({
                selectedForCustomize: new Set([...selectedForCustomize, student_id])
            })
            this.props.rateAppetite(student_id, this.state.mealType, '', teacher_id)
        }
    }

    isRatingCustomized(rating) {
        const { mealType } = this.state
        if (mealType === '') {
            return false
        } else if (rating === '胃口佳' || rating === '滿滿一碗' || rating === '７/8分滿' || rating === '半碗' || rating === '胃口不佳' || rating === '') {
            return false
        }
        return true
    }

    onCustomizeRating(student_id, customized_text) {
        const {teacher_id } = this.props.route.params
        this.props.rateAppetite(student_id, this.state.mealType, customized_text, teacher_id)
    }

    customizedRatingOnBlur(student_id) {
        const { selectedForCustomize } = this.state
        selectedForCustomize.delete(student_id)
        this.setState({
            selectedForCustomize
        })
    }

    markWaterDrank(student_id) {
        const {teacher_id } = this.props.route.params
        if (this.state.mealType === '') {
            Toast.show({
                text: '請選擇餐時',
                buttonText: 'Okay',
                position: 'top',
                duration: 3000
            })
        } else {
            this.props.markWaterDrank(student_id, this.state.mealType, teacher_id)
        }
    }

    handleSetAll() {
        const { teacher_id } = this.props.route.params
        const { students_to_display } = this.state
        if (this.state.mealType === '') {
            Toast.show({
                text: '請選擇餐時',
                buttonText: 'Okay',
                position: 'top',
                duration: 3000
            })
        } else {
            this.props.setAllRatingsToGreat(this.state.mealType, [...students_to_display], teacher_id)
        }
    }

    handleClearAll() {
        if (this.state.mealType === '') {
            Toast.show({
                text: '請選擇餐時',
                buttonText: 'Okay',
                position: 'top',
                duration: 3000
            })
        } else {
            this.props.clearRatings(this.state.mealType)
        }
    }

    handleAllDrank() {
        const {teacher_id } = this.props.route.params
        const { students_to_display } = this.state
        if (this.state.mealType === '') {
            Toast.show({
                text: '請選擇餐時',
                buttonText: 'Okay',
                position: 'top',
                duration: 3000
            })
        } else {
            this.props.setAllDrinkWater(this.state.mealType, [...students_to_display], teacher_id)
        }
    }

    handleSend() {
        const { isConnected } = this.props.class
        const {updatedStudents, fruit_name} = this.props.appetite
        var data_objs = [],
            appetite_log = this.props.appetite.ratings
        
        if (updatedStudents.size === 0) {
            this.props.navigation.goBack()
        }

        if (!isConnected) {
            Toast.show({
                text: '網路連線連不到! 等一下再試試看',
                buttonText: 'Okay',
                position: "top",
                type: "danger",
                duration: 4000
            })
            return
        }

        updatedStudents.forEach(student_id => {
            const ratings = appetite_log[student_id] // get ratings obj for student
            const data = { // create query data and append to data_objs
                student_id,
                b_rating: ratings.Breakfast,
                f_rating: ratings.Fruit,
                l_rating: ratings.Lunch,
                s_rating: ratings.Snack,
                teacher_id: ratings.teacher_id
            }
            data_objs.push(data)
        })
        
        const request_body = {
            date: formatDate(new Date()),
            fruit_name,
            obj: data_objs
        }

        fetch('https://iejnoswtqj.execute-api.us-east-1.amazonaws.com/dev/appetite', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(request_body)
        }).then(res => res.json())
            .then(resJson => {
                // console.log(resJson)
                const { statusCode, message } = resJson
                if (statusCode > 200 || message === 'Internal Server Error') {
                    this.props.alertErrMessage(message)
                } else {
                    this.props.onSendAppetiteSuccess()
                    this.props.navigation.goBack()
                }
            })
            .catch(err => {
                this.props.alertErrMessage(err)
            })
    }

    selectDatetimeConfirm(date) {
        this.setState({
            date,
            showDateTimeModal: false
        })
        this.fetchClassData(date)
    }

    addStudentToDisplayList(student_id) {
        const { display_all_students, students_to_display } = this.state
        if (display_all_students) {
            this.setState({
                students_to_display: new Set([student_id]),
                display_all_students: false
            })
        } else if (students_to_display.has(student_id)) {
            let new_students_to_display = new Set([...students_to_display])
            new_students_to_display.delete(student_id)
            this.setState({ students_to_display: new_students_to_display })
        } else {
            let new_students_to_display = new Set([...students_to_display])
            new_students_to_display.add(student_id)
            this.setState({ students_to_display: new_students_to_display })
        }

    }

    // keyboardDidHide = () => {
    //     Keyboard.dismiss();
    // }

    componentWillUnmount() {
        // this.keyboardDidHideListener.remove()
    }

    render() {
        if (this.props.appetite.err_message !== ''){
            Alert.alert(
                'Error!',
                this.props.appetite.err_message,
                [{text: 'OK', onPress: () => this.props.clearAppetiteErrorMessage()}]
            )
        }
        const { isAdmin } = this.props.route.params
        const { mealType, selectedForCustomize, editingFruitType, date, showDateTimeModal, display_all_students, students_to_display } = this.state
        const { students } = this.props.class
        // console.log('this.props.appetite: ', this.props.appetite)
        // console.log('students_to_display: ', students_to_display)
        // console.log('this.props.appetite.updatedStudents', this.props.appetite.updatedStudents)
        return (
            <KeyboardAvoidingView
                style={{
                    flex: 1,
                    backgroundColor: mealType === 'Breakfast' ? '#ffe1d0'
                                    : mealType === 'Fruit' ? '#ffddb7'
                                    : mealType === 'Lunch' ? '#fff1b5'
                                    : mealType === 'Snack' ? '#dcf3d0'
                                    : 'transparent'
                }}
                behavior='height'
                keyboardVerticalOffset={80}
                enabled
            >
                {showDateTimeModal && <TimeModal
                    start_date={date}
                    datetime_type={'date'}
                    hideModal={() => this.setState({ showDateTimeModal: false })}
                    selectDatetimeConfirm={(datetime) => this.selectDatetimeConfirm(datetime)}
                    minDatetime={null}
                    maxDatetime={new Date()}
                />}
                <View style={styles.subHeading}>
                    <TouchableHighlight
                        onPress={() => {
                            const { data_dispatched } = this.props.appetite
                            if (!data_dispatched || !isAdmin) return
                            this.setState({ showDateTimeModal: true })
                        }}
                    >
                        <Text style={{ fontSize: 40 }}>{beautifyDate(date)}</Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={{ backgroundColor: '#b5e9e9', padding: 10 }}
                        onPress={this.handleSetAll}>
                        <Text style={{ color: 'grey', fontSize: 40 }}>全胃口佳</Text>
                    </TouchableHighlight>
                    {/* <TouchableHighlight
                        style={{ backgroundColor: '#ffe1d0', padding: 10  }}
                        onPress={this.handleClearAll}>
                        <Text style={{ color: 'grey', fontSize: 40 }}>全部清除</Text>
                    </TouchableHighlight> */}
                    <TouchableHighlight
                        style={{ backgroundColor: '#b5e9e9', padding: 10  }}
                        onPress={this.handleAllDrank}
                    >
                        <Text style={{ color: 'grey', fontSize: 40 }}>全喝水</Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={{ backgroundColor: '#dcf3d0', padding: 10  }}
                        onPress={this.handleSend}>
                        <Text style={{ color: 'grey', fontSize: 40 }}>送出</Text>
                    </TouchableHighlight>
                </View>

                <View style={styles.mealButtons}>
                    <TouchableHighlight
                        style={{
                            backgroundColor: mealType === 'Breakfast' ? '#fa625f' : '#ffe1d0',
                            width: '23%',
                            height: 60,
                            justifyContent: 'center',
                            marginHorizontal: '1%',
                            padding: 10
                        }}
                        underlayColor='#fa625f'
                        onPress={() => this.setState({ mealType: 'Breakfast', editingFruitType: false })}
                    >
                        <Text style={styles.mealButtonText}>早餐</Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={{
                            backgroundColor: mealType === 'Fruit' ? '#ff8944' : '#ffddb7',
                            width: '23%',
                            height: 60,
                            justifyContent: 'center',
                            marginHorizontal: '1%',
                            // padding: 10
                        }}
                        underlayColor='#ff8944'
                        onPress={() => this.setState({ mealType: 'Fruit' })}
                        onLongPress={() => this.setState({ mealType: 'Fruit', editingFruitType: true })}
                    >
                        {editingFruitType ?
                            <View style={{ flex: 1 }}>
                                <Text style={{ paddingLeft: 5 }}>水果:</Text>
                                <TextInput
                                    autoFocus={true}
                                    selectTextOnFocus={true}
                                    style={{ width: '95%', alignSelf: 'center', fontSize: 25, textAlign: 'center', color: 'grey', borderWidth: 1 }}
                                    onChangeText={fruit_name => this.editFruitName(fruit_name)}
                                    value={this.props.appetite.fruit_name}
                                    onBlur={() => this.fruitNameEditorOnBlur()}
                                />
                            </View>
                        :   <Text style={styles.mealButtonText}>{this.props.appetite.fruit_name}</Text>
                        }
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={{
                            backgroundColor: mealType === 'Lunch' ? '#f4d41f' : '#fff1b5',
                            width: '23%',
                            height: 60,
                            justifyContent: 'center',
                            marginHorizontal: '1%',
                            padding: 10
                        }}
                        underlayColor='#f4d41f'
                        onPress={() => this.setState({ mealType: 'Lunch', editingFruitType: false })}
                    >
                        <Text style={styles.mealButtonText}>午餐</Text>
                    </TouchableHighlight>
                    <TouchableHighlight
                        style={{
                            backgroundColor: mealType === 'Snack' ? '#00c07f' : '#dcf3d0',
                            width: '23%',
                            height: 60,
                            justifyContent: 'center',
                            marginHorizontal: '1%',
                            padding: 10
                        }}
                        underlayColor='#00c07f'
                        onPress={() => this.setState({ mealType: 'Snack', editingFruitType: false })}
                    >
                        <Text style={styles.mealButtonText}>點心</Text>
                    </TouchableHighlight>
                </View>

                <View style={{ width: '98%', flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center', justifyContent: 'space-evenly' }}>
                    <TouchableHighlight
                        style={{
                            padding: 5,
                            backgroundColor: display_all_students ? '#b5e9e9' : 'rgba(255,255,255,0.8)',
                            marginRight: 3
                        }}
                        onPress={() => {
                            this.setState({
                                display_all_students: true,
                                students_to_display: new Set(Object.keys(students))
                            })
                        }}
                    >
                        <Text style={{ fontSize: 25 }}>全班</Text>
                    </TouchableHighlight>
                    {Object.keys(students).map((student_id) => {
                        return (
                            <TouchableHighlight
                                key={student_id}
                                style={{
                                    padding: 5,
                                    backgroundColor: students_to_display.has(student_id) && !display_all_students ? '#b5e9e9' : 'rgba(255,255,255,0.8)',
                                    marginRight: 3
                                }}
                                onPress={() => this.addStudentToDisplayList(student_id)}
                            >
                                <Text style={{ fontSize: 25 }}>{students[student_id].name}</Text>
                            </TouchableHighlight>
                        )
                    })}
                </View>
                
                <Content contentContainerStyle={{ alignItems: 'center' }}>
                    {[...students_to_display].reverse().map((student_id) => {
                        const meal_rating = mealType === '' ? '' : this.props.appetite.ratings[student_id][mealType].slice(0,-1)
                        const water_drank = mealType === '' ? false : this.props.appetite.ratings[student_id][mealType].slice(-1) === '1'
                        return (
                            <View
                                key={student_id}
                                style={{ width: '98%' }}
                            >
                                <Card>
                                    <CardItem>
                                        <View style={styles.childThumbnail}>
                                            <Image
                                                source={
                                                    this.props.class.students[student_id].profile_picture === '' ?
                                                        require('../../../assets/icon-thumbnail.png')
                                                        : {uri: this.props.class.students[student_id].profile_picture}
                                                }
                                                style={styles.thumbnailImage}/>
                                        </View>
                                        <View style={{ width: '80%' }}>
                                            <View style={{ flex: 1 }}>
                                                <View style={{ flex: 1, flexDirection: 'row' }}>
                                                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                                        <Text style={{ fontSize: 30, paddingLeft: 18, alignSelf: 'center' }}>
                                                            {this.props.class.students[student_id].name}
                                                        </Text>
                                                    </View>
                                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                                        <TouchableHighlight
                                                            style={{
                                                                width: '80%',
                                                                borderWidth: 2,
                                                                borderColor: '#368cbf',
                                                                padding: 10,
                                                                justifyContent: 'center',
                                                                backgroundColor: water_drank ? '#368cbf': 'white'
                                                            }}
                                                            onPress={() => this.markWaterDrank(student_id)}
                                                        >
                                                            <Text style={{
                                                                textAlign: 'center',
                                                                color: water_drank ? '#D3D3D3': 'grey',
                                                                fontSize: 17
                                                            }}>有喝水</Text>
                                                        </TouchableHighlight>
                                                    </View>
                                                    <View style={{ flex: 2, alignItems: 'flex-end'}}>
                                                        {this.props.appetite.updatedStudents.has(student_id) ?
                                                            <Text style={{ color: 'red', fontSize: 15 }}>未送出</Text>
                                                            : null
                                                        }
                                                    </View>
                                                </View>
                                                <View style={{...styles.cardBody, marginVertical: 15}}>
                                                    <TouchableHighlight
                                                        style={{
                                                            width: '30%',
                                                            height: '100%',
                                                            // marginRight: '3%',
                                                            justifyContent: 'center',
                                                            backgroundColor: meal_rating === '胃口佳' ? '#368cbf' : '#b5e9e9',
                                                            padding: 15
                                                        }}
                                                        onPress={() => this.handleRateFoodWellness(student_id, '胃口佳')}
                                                    >
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                color: meal_rating === '胃口佳' ? '#D3D3D3' : 'grey',
                                                                fontSize: 20
                                                            }}
                                                        >
                                                            胃口佳
                                                        </Text>
                                                    </TouchableHighlight>
                                                    <TouchableHighlight
                                                        style={{
                                                            width: '30%',
                                                            height: '100%',
                                                            // marginRight: '3%',
                                                            justifyContent: 'center',
                                                            backgroundColor: meal_rating === '滿滿一碗' ? '#368cbf' : '#b5e9e9',
                                                            padding: 15
                                                        }}
                                                        onPress={() => this.handleRateFoodWellness(student_id, '滿滿一碗')}
                                                    >
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                color: meal_rating === '滿滿一碗' ? '#D3D3D3' : 'grey',
                                                                fontSize: 20
                                                            }}
                                                        >
                                                            滿滿一碗
                                                        </Text>
                                                    </TouchableHighlight>
                                                    <TouchableHighlight
                                                        style={{
                                                            width: '30%',
                                                            height: '100%',
                                                            // marginRight: '3%',
                                                            justifyContent: 'center',
                                                            backgroundColor: meal_rating === '７/8分滿' ? '#368cbf' : '#b5e9e9',
                                                            padding: 15
                                                        }}
                                                        onPress={() => this.handleRateFoodWellness(student_id, '７/8分滿')}
                                                    >
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                color: meal_rating === '７/8分滿' ? '#D3D3D3' : 'grey',
                                                                fontSize: 20
                                                            }}
                                                        >
                                                            ７/8分滿
                                                        </Text>
                                                    </TouchableHighlight>
                                                </View>
                                                <View style={styles.cardBody}>
                                                    <TouchableHighlight
                                                        style={{
                                                            width: '30%',
                                                            height: '100%',
                                                            // margin: 5,
                                                            justifyContent: 'center',
                                                            backgroundColor: meal_rating === '半碗' ? '#368cbf' : '#b5e9e9',
                                                            padding: 15
                                                        }}
                                                        onPress={() => this.handleRateFoodWellness(student_id, '半碗')}
                                                    >
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                color: meal_rating === '半碗' ? '#D3D3D3' : 'grey',
                                                                fontSize: 20
                                                            }}
                                                        >
                                                            半碗
                                                        </Text>
                                                    </TouchableHighlight>
                                                    <TouchableHighlight
                                                        style={{
                                                            width: '30%',
                                                            height: '100%',
                                                            // margin: 5,
                                                            justifyContent: 'center',
                                                            backgroundColor: meal_rating === '胃口不佳' ? '#368cbf' : '#b5e9e9',
                                                            padding: 15
                                                        }}
                                                        onPress={() => this.handleRateFoodWellness(student_id, '胃口不佳')}
                                                    >
                                                        <Text
                                                            style={{
                                                                textAlign: 'center',
                                                                color: meal_rating === '胃口不佳' ? '#D3D3D3' : 'grey',
                                                                fontSize: 20
                                                            }}
                                                        >
                                                            胃口不佳
                                                        </Text>
                                                    </TouchableHighlight>
                                                    <TouchableHighlight
                                                        style={{
                                                            width: '30%',
                                                            height: '100%',
                                                            // margin: 5,
                                                            justifyContent: 'center',
                                                            backgroundColor:
                                                                this.isRatingCustomized(meal_rating) || selectedForCustomize.has(student_id) ?
                                                                    '#368cbf'
                                                                    : '#b5e9e9',
                                                            padding: 15
                                                        }}
                                                        onPress={() => this.onClickOther(student_id)}
                                                    >
                                                        {this.isRatingCustomized(meal_rating) || selectedForCustomize.has(student_id) ?
                                                            <TextInput
                                                                style={{
                                                                    textAlign: 'center',
                                                                    color: '#D3D3D3',
                                                                    fontSize: 20
                                                                }}
                                                                maxLength={6}
                                                                autoFocus={meal_rating === '' ? true : false}
                                                                onChangeText={customized_text => this.onCustomizeRating(student_id, customized_text)}
                                                                value={meal_rating}
                                                                onBlur={() => this.customizedRatingOnBlur(student_id)}
                                                            />
                                                            : <Text
                                                                style={{
                                                                    textAlign: 'center',
                                                                    color: this.isRatingCustomized(meal_rating) || selectedForCustomize.has(student_id) ? '#D3D3D3' : 'grey',
                                                                    fontSize: 20
                                                                }}
                                                            >
                                                                Other
                                                            </Text>
                                                        }
                                                    </TouchableHighlight>
                                                </View>
                                            </View>
                                        </View>
                                    </CardItem>
                                </Card>
                            </View>
                        )
                    })}
                </Content>
            </KeyboardAvoidingView>
        )
    }
}

const styles = StyleSheet.create({
    childThumbnail: {
        width: '20%',
        // width: 100,
        // height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        // marginLeft: -7,
        // backgroundColor: 'red'
    },
    cardBody: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // marginBottom: 15
        // backgroundColor: 'lightblue'
    },
    foodButton: {
        width: 70,
        alignSelf: 'center',
        margin: 5,
        justifyContent: 'center',
        backgroundColor: '#b5e9e9'
    },
    thumbnailImage: {
        height: 130,
        width: 130,
        borderRadius: 65
    },
    subHeading: {
        width: '99%',
        // height: 45,
        paddingHorizontal: '4%',
        // marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // backgroundColor: '#ccd2dd',
        zIndex: 2
    },
    mealButtons: {
        width: '99%',
        // height: 45,
        marginVertical: 15,
        // marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // zIndex: 1,
        // position: 'absolute'
    },
    mealButtonText: {
        fontSize: 30,
        textAlign: 'center'
    },
    buttonText: {
        color: 'grey',
        textAlign: 'center'
    }
})

const mapStatesToProps = (state) => {
    return {
        class: state.classInfo,
        appetite: state.appetite
    }
}

const mapDispatchToProps = (dispatch) => {
    return {
        ...bindActionCreators({
            rateAppetite,
            clearRatings,
            setAllRatingsToGreat,
            setAllDrinkWater,
            fetchClassAppetiteData,
            onSendAppetiteSuccess,
            alertErrMessage,
            markWaterDrank,
            editFruitName,
            clearAppetiteErrorMessage,
            addStudentIdForUpdate
        }, dispatch)
    }
}

export default connect(mapStatesToProps, mapDispatchToProps) (TeacherAppetiteLog)